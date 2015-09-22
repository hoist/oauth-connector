'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _lodash = require('lodash');

var _hoistOauth = require('@hoist/oauth');

var _hoistLogger = require('@hoist/logger');

var _hoistLogger2 = _interopRequireDefault(_hoistLogger);

/**
 * @protected
 * The base OAuth2 Connector class used for Hoist Connectors to implement OAuth2 flows
 * @implements {ConnectorInterface}
 */

var OAuthConnectorBase = (function () {

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

  function OAuthConnectorBase(configuration) {
    _classCallCheck(this, OAuthConnectorBase);

    this._logger = _hoistLogger2['default'].child({
      cls: this.constructor.name
    });
    this._configuration = configuration;
    this._configuration.authorizationUri = _url2['default'].parse(this._configuration.authorizationUri, true);
    this._auth = _bluebird2['default'].promisifyAll(new _hoistOauth.OAuth(configuration.requestTokenUri, configuration.accessTokenUri, configuration.consumerKey, configuration.consumerSecret, configuration.oauthVersion || '1.0A', 'https://' + _config2['default'].get('Hoist.domains.bouncer') + '/bounce', configuration.signingMethod || 'HMAC-SHA1'));
  }

  /**
   * perform an authorized request
   * @param {string} method - the HTTP method to call
   * @param {string} requestUri - the uri of the request to call
   * @param {string} body - the data to send
   * @param {string} contentType - the contentType header
   */

  _createClass(OAuthConnectorBase, [{
    key: '_performRequest',
    value: function _performRequest(method, requestUri, body, contentType) {
      return this._auth._performSecureRequestAsync(this._accessToken, this._accessTokenSecret, method, requestUri, null, body, contentType);
    }

    /**
     * authorize the oauth connection with existing parameters
     * @param {<AuthorizationStore>} authorization - the users authorization
     */
  }, {
    key: 'authorize',
    value: function authorize(authorization) {
      this._accessToken = authorization.get('AccessToken');
      this._accessTokenSecret = authorization.get('AccessTokenSecret');
    }

    /**
     * @param {AuthorizationStore} authorization - the users authorization
     */
  }, {
    key: 'receiveBounce',
    value: function receiveBounce(authorization) {
      var _this = this;

      console.log(this);
      this._logger.info('receiving bounce');
      var authStep = authorization.get('currentStep');
      switch (authStep) {
        case 'RequestToken':
          //get access token
          this._logger.info('requesting access token');
          return this._auth.getOAuthAccessTokenAsync(authorization.get('RequestToken'), authorization.get('RequestTokenSecret'), authorization.query.oauth_verifier).then(function (results) {
            return Promise.all([authorization.set('AccessToken', results[0]), authorization.set('AccessTokenSecret', results[1]), authorization.set('currentStep', 'AccessToken')]).then(function () {
              return authorization.done();
            });
          });

          break;

        default:
          //do request token auth
          this._logger.info('requesting request token');
          return this._auth.getOAuthRequestTokenAsync().then(function (results) {
            return Promise.all([authorization.set('RequestToken', results[0]), authorization.set('RequestTokenSecret', results[1]), authorization.set('currentStep', 'RequestToken')]).then(function () {
              _this._logger.info('redirecting user');
              var authorizationUri = _this._configuration.authorizationUri;
              authorizationUri.query = authorizationUri.query || {};
              authorizationUri.query.oauth_token = results[0];
              return authorization.redirect(authorizationUri.format());
            });
          });
      }
      //default just mark as done
      return authorization.done();
    }
  }]);

  return OAuthConnectorBase;
})();

exports['default'] = OAuthConnectorBase;
module.exports = exports['default'];
//# sourceMappingURL=oauth_connector.js.map