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
export default class OAuth2Connector {

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
    this._auth = Bluebird.promisifyAll(new OAuth2(configuration.clientId, configuration.clientSecret, configuration.baseSite, configuration.authorizationPath, configuration.accessTokenPath, configuration.customHeaders));
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
   * Populate any extra params needed to request the access token
   * @protected
   * @param {AuthorizationStore} authorization - the users authorisation store
   * @returns {Promise<object>} - an object containing key value pairs to send with the access token request
   */
  _accessParams(authorization) {
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
    let headers = {
      'Content-Type': contentType,
      'User-Agent': 'Hoist',
      'Authorization': this._auth.buildAuthHeader(this._accessToken)
    };
    return this._auth._requestAsync(method, requestUri, headers, this._accessToken);
  }

  /**
   * authorize the oauth connection with existing parameters
   * @param {<AuthorizationStore>} authorization - the users authorization
   */
  authorize(authorization) {
    this._accessToken = authorization.get('AccessToken');
    this._refreshToken = authorization.get('RefreshToken');
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
            });
        });
    }
    //default just mark as done
    return authorization.done();
  }

}
