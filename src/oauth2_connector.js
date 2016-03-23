'use strict';
import Bluebird from 'bluebird';
import config from 'config';
import {
  OAuth2
}
from '@hoist/oauth';

/**
 * @protected
 * The base OAuth2 Connector class used for Hoist Connectors to implement OAuth2 flows
 * @implements {ConnectorInterface}
 */
export class OAuth2ConnectorBase {

  /**
   * @protected
   * create a new OAuth2Connector
   * @param {object} configuration - the configuration details for this connector
   * @param {string} configuration.clientId - the OAuth2 client id
   * @param {string} configuration.clientSecret - the OAuth2 client secret
   * @param {string} configuration.baseSite - the base uri to use for authorization calls
   * @param {string} [configuration.authorizationPath=/oauth/authorize] - the path to send users to authorise access
   * @param {string} [configuration.accessTokenPath=/oauth/access_token] - the path to use to retrieve access tokens
   * @param {object} [configuration.customHeaders] - any custom headers to send
   */
  constructor(configuration) {
    this._configureClient(configuration);
  }

  /**
   * Populate any extra params needed to grant access
   * @protected
   * @param {AuthorizationStore} authorization - the users authorisation store
   * @returns {Promise<object>} - an object containing key value pairs to send with the client to the authorization url
   */
  _authorizeParams(authorization) {
    return Promise.resolve({
      redirect_uri: `https://${config.get('Hoist.domains.bouncer')}/bounce`
    });
  }

  /**
   * @protected
   * configure the underlying oauth provider
   * @param {object} configuration - the configuration details for this connector
   * @param {string} configuration.clientId - the OAuth2 client id
   * @param {string} configuration.clientSecret - the OAuth2 client secret
   * @param {string} configuration.baseSite - the base uri to use for authorization calls
   * @param {string} [configuration.authorizationPath=/oauth/authorize] - the path to send users to authorise access
   * @param {string} [configuration.accessTokenPath=/oauth/access_token] - the path to use to retrieve access tokens
   * @param {object} [configuration.customHeaders] - any custom headers to send
   */
  _configureClient(configuration) {
    this._auth = Bluebird.promisifyAll(new OAuth2(configuration.clientId, configuration.clientSecret, configuration.baseSite, configuration.authorizationPath, configuration.accessTokenPath, configuration.customHeaders), {
      multiArgs: true
    });
    this._auth._requestAsync = Bluebird.promisify(this._auth._request, this._auth, {
      multiArgs: true
    });
  }

  /**
   * Populate any extra params needed to request the access token
   * @protected
   * @param {AuthorizationStore} authorization - the users authorisation store
   * @returns {Promise<object>} - an object containing key value pairs to send with the access token request
   */
  _accessParams(authorization) {
    return Promise.resolve();
  }
  _processResults(results) {
    return Promise.resolve();
  }

  /**
   * perform an authorized request
   * @param {string} method - the HTTP method to call
   * @param {string} requestUri - the uri of the request to call
   * @param {object} body - the data to send
   * @param {string} contentType - the contentType header
   */
  _performRequest(method, requestUri, body, contentType) {
    let accessToken = this._authorization.get('AccessToken');
    let headers = {
      'Content-Type': contentType || 'application/json',
      'User-Agent': 'Hoist',
      'Authorization': this._auth.buildAuthHeader(accessToken)
    };
    if (body && !(typeof (body) === 'string' || body instanceof Buffer)) {
      body = JSON.stringify(body);
    }
    return this._auth._requestAsync(method, requestUri, headers, body, accessToken);
  }

  /**
   * authorize the oauth connection with existing parameters
   * @param {<AuthorizationStore>} authorization - the users authorization
   */
  authorize(authorization) {
    this._authorization = authorization;
  }

  /**
   * @param {AuthorizationStore} authorization - the users authorization
   */
  receiveBounce(authorization) {
    var authStep = authorization.get('currentStep');
    if (!authStep) {
      //no authorization has been done yet so lets get the authorization url and redirec the user there
      return this._authorizeParams(authorization)
        .then((params) => {
          return this._auth.getAuthorizeUrl(params);
        }).then((authUri) => {
          //set the step so we know to get the access token when they return
          return authorization.set('currentStep', 'authorization')
            .then(() => {
              //redirect the user
              return authorization.redirect(authUri);
            })
        });
    } else if (authStep === 'authorization') {
      return this._accessParams(authorization)
        .then((params) => {
          return this._auth.getOAuthAccessTokenAsync(authorization.query.code, params);
        }).then((results) => {
          return authorization.set('AccessToken', results[0])
            .then(() => {
              return authorization.set('RefreshToken', results[1]);
            }).then(() => {
              return this._processResults(results[2]);
            }).then(() => {
              return authorization.done();
            });
        });
    }
    //default just mark as done
    return authorization.done();
  }

}
