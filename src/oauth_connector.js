'use strict';
import Bluebird from 'bluebird';
import config from 'config';
import url from 'url';
import {
  clone
}
from 'lodash';
import {
  OAuth
}
from '@hoist/oauth';
import logger from '@hoist/logger';

/**
 * @protected
 * The base OAuth2 Connector class used for Hoist Connectors to implement OAuth2 flows
 * @implements {ConnectorInterface}
 */
export default class OAuthConnectorBase {

  /**
   * @protected
   * create a new OAuth2Connector
   * @param {object} configuration - the configuration details for this connector
   * @param {string} configuration.consumerKey - the OAuth consumer key
   * @param {string} configuration.consumerSecret - the OAuth consumer secret
   * @param {string} configuration.requestTokenUri - the uri to use for request token calls
   * @param {string} configuration.accessTokenUri - the uri to use for access token calls
   * @param {string} configuration.authorizationUri - the uri to send users to authorise access
   * @param {object} [configuration.oauthVersion=1.0A] - the version of OAuth to use
   * @param {object} [configuration.signingMethod=HMAC-SHA1] - the signing method to use
   */
  constructor(configuration) {
    this._logger = logger.child({
      cls: this.constructor.name
    });
    this._configuration = configuration;
    this._configuration.authorizationUri = url.parse(this._configuration.authorizationUri, true);
    delete this._configuration.authorizationUri.search;
    this._logger.info({
      configuraion: this._configuration
    });
    this._auth = Bluebird.promisifyAll(
      new OAuth(
        configuration.requestTokenUri,
        configuration.accessTokenUri,
        configuration.consumerKey,
        configuration.consumerSecret,
        configuration.oauthVersion || '1.0A',
        `https://${config.get('Hoist.domains.bouncer')}/bounce`,
        configuration.signingMethod || 'HMAC-SHA1'
      ));
    this._auth._performSecureRequestAsync = Bluebird.promisify(this._auth._performSecureRequest, this._auth)
  }

  /**
   * perform an authorized request
   * @param {string} method - the HTTP method to call
   * @param {string} requestUri - the uri of the request to call
   * @param {string} body - the data to send
   * @param {string} contentType - the contentType header
   */
  _performRequest(method, requestUri, body, contentType) {
    let extraParams;
    if (contentType && contentType === 'application/x-www-form-urlencoded') {
      extraParams = body;
      body = null;
    }
    if (body && (!(typeof (body) === 'string' || body instanceof Buffer))) {
      body = JSON.stringify(body);
    }

    return this._auth._performSecureRequestAsync(
      this._accessToken,
      this._accessTokenSecret,
      method,
      requestUri,
      extraParams,
      body,
      contentType || 'application/json')
  }

  _setupAuthorizationQuery(query) {
    return query;
  }

  /**
   * authorize the oauth connection with existing parameters
   * @param {<AuthorizationStore>} authorization - the users authorization
   */
  authorize(authorization) {
    this._accessToken = authorization.get('AccessToken');
    this._accessTokenSecret = authorization.get('AccessTokenSecret');
  }

  /**
   * @param {AuthorizationStore} authorization - the users authorization
   */
  receiveBounce(authorization) {
    this._logger.info('receiving bounce');
    var authStep = authorization.get('currentStep');
    switch (authStep) {
    case 'RequestToken':
      //get access token
      this._logger.info('requesting access token');
      return this._auth.getOAuthAccessTokenAsync(
          authorization.get('RequestToken'),
          authorization.get('RequestTokenSecret'),
          authorization.query.oauth_verifier)
        .then((results) => {
          return authorization.set('AccessToken', results[0]).then(() => {
            return authorization.set('AccessTokenSecret', results[1]);
          }).then(() => {
            return authorization.set('currentStep', 'AccessToken');
          }).then(() => {
            return authorization.done();
          });
        })

      break;

    default:
      //do request token auth
      this._logger.info('requesting request token');
      return this._auth.getOAuthRequestTokenAsync()
        .then((results) => {
          return authorization.set('RequestToken', results[0]).
          then(() => {
            return authorization.set('RequestTokenSecret', results[1]);
          }).then(() => {
            return authorization.set('currentStep', 'RequestToken')
          }).then(() => {
            this._logger.info('redirecting user');
            let authorizationUri = this._configuration.authorizationUri;
            authorizationUri.query = this._setupAuthorizationQuery(authorizationUri.query || {});
            authorizationUri.query.oauth_token = results[0];
            return authorization.redirect(authorizationUri.format())
          });
        });
    }
    //default just mark as done
    return authorization.done();
  }

}
