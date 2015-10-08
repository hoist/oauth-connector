/**
 * @interface
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AuthorizationStore = (function () {
  function AuthorizationStore() {
    _classCallCheck(this, AuthorizationStore);
  }

  _createClass(AuthorizationStore, [{
    key: "set",

    /**
     * sets and saves a value against the store
     * @param {string} key - the key to store the value against
     * @param {object} value - the value to store
     * @returns {Promise} - a promise to have saved the value
     */
    value: function set(key, value) {}

    /**
     * gets a value saved against the specified key
     *
     * @param {string} key - the key the value is saved against
     * @returns {object} - the value at the specified key or null
     */
  }, {
    key: "get",
    value: function get(key) {}

    /**
     * removes any value saved against the specified key permanently
     * @param {string} key - the key the value is saved against
     * @returns {Promise} - a promise to have deleted the value from the store
     */
  }, {
    key: "delete",
    value: function _delete(key) {}

    /**
     * mark the current authorization flow as complete i.e. after having swapped all access tokens and request tokens
     * @returns {undefined}
     */
  }, {
    key: "done",
    value: function done() {}

    /**
     * redirect the user to the specified uri
     * the user is no longer present after this call so should only happen at the end of a flow
     * @param {string} uri - the uri to redirect the user to
     * @returns {undefined}
     */
  }, {
    key: "redirect",
    value: function redirect(uri) {}
  }, {
    key: "query",

    /**
     * the query params the user is currently showing
     * @type {object}
     */
    get: function get() {}
  }]);

  return AuthorizationStore;
})();

exports["default"] = AuthorizationStore;
module.exports = exports["default"];
//# sourceMappingURL=authorisation_store.js.map
