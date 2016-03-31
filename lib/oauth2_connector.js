'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OAuth2ConnectorBase = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _oauth = require('@hoist/oauth');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @protected
 * The base OAuth2 Connector class used for Hoist Connectors to implement OAuth2 flows
 * @implements {ConnectorInterface}
 */

var OAuth2ConnectorBase = exports.OAuth2ConnectorBase = function () {

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

  function OAuth2ConnectorBase(configuration) {
    _classCallCheck(this, OAuth2ConnectorBase);

    this._configureClient(configuration);
  }

  /**
   * Populate any extra params needed to grant access
   * @protected
   * @param {AuthorizationStore} authorization - the users authorisation store
   * @returns {Promise<object>} - an object containing key value pairs to send with the client to the authorization url
   */


  _createClass(OAuth2ConnectorBase, [{
    key: '_authorizeParams',
    value: function _authorizeParams(authorization) {
      return Promise.resolve({
        redirect_uri: 'https://' + _config2.default.get('Hoist.domains.bouncer') + '/bounce'
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

  }, {
    key: '_configureClient',
    value: function _configureClient(configuration) {
      this._auth = _bluebird2.default.promisifyAll(new _oauth.OAuth2(configuration.clientId, configuration.clientSecret, configuration.baseSite, configuration.authorizationPath, configuration.accessTokenPath, configuration.customHeaders), {
        multiArgs: true
      });
      this._auth._requestAsync = _bluebird2.default.promisify(this._auth._request, this._auth, {
        multiArgs: true
      });
    }

    /**
     * Populate any extra params needed to request the access token
     * @protected
     * @param {AuthorizationStore} authorization - the users authorisation store
     * @returns {Promise<object>} - an object containing key value pairs to send with the access token request
     */

  }, {
    key: '_accessParams',
    value: function _accessParams(authorization) {
      return Promise.resolve();
    }
  }, {
    key: '_processResults',
    value: function _processResults(results) {
      return Promise.resolve();
    }

    /**
     * perform an authorized request
     * @param {string} method - the HTTP method to call
     * @param {string} requestUri - the uri of the request to call
     * @param {object} body - the data to send
     * @param {string} contentType - the contentType header
     * @param {object} overridHeaders - headers to add or override in the request
     */

  }, {
    key: '_performRequest',
    value: function _performRequest(method, requestUri, body, contentType, overrideHeaders) {
      overridHeaders = overrideHeaders || {};
      var accessToken = this._authorization.get('AccessToken');
      var coreHeaders = {
        'Content-Type': contentType || 'application/json',
        'User-Agent': 'Hoist',
        'Authorization': this._auth.buildAuthHeader(accessToken)
      };
      var headers = Object.assign({}, coreHeaders, overridHeaders);

      if (body && !(typeof body === 'string' || body instanceof Buffer)) {
        body = JSON.stringify(body);
      }
      return this._auth._requestAsync(method, requestUri, headers, body, accessToken);
    }

    /**
     * authorize the oauth connection with existing parameters
     * @param {<AuthorizationStore>} authorization - the users authorization
     */

  }, {
    key: 'authorize',
    value: function authorize(authorization) {
      this._authorization = authorization;
    }

    /**
     * @param {AuthorizationStore} authorization - the users authorization
     */

  }, {
    key: 'receiveBounce',
    value: function receiveBounce(authorization) {
      var _this = this;

      var authStep = authorization.get('currentStep');
      if (!authStep) {
        //no authorization has been done yet so lets get the authorization url and redirec the user there
        return this._authorizeParams(authorization).then(function (params) {
          return _this._auth.getAuthorizeUrl(params);
        }).then(function (authUri) {
          //set the step so we know to get the access token when they return
          return authorization.set('currentStep', 'authorization').then(function () {
            //redirect the user
            return authorization.redirect(authUri);
          });
        });
      } else if (authStep === 'authorization') {
        return this._accessParams(authorization).then(function (params) {
          return _this._auth.getOAuthAccessTokenAsync(authorization.query.code, params);
        }).then(function (results) {
          return authorization.set('AccessToken', results[0]).then(function () {
            return authorization.set('RefreshToken', results[1]);
          }).then(function () {
            return _this._processResults(results[2]);
          }).then(function () {
            return authorization.done();
          });
        });
      }
      //default just mark as done
      return authorization.done();
    }
  }]);

  return OAuth2ConnectorBase;
}();
//# sourceMappingURL=oauth2_connector.js.map
