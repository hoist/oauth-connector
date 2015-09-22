'use strict';

/**
 * @interface
 */
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var ConnectorInterface = (function () {
  function ConnectorInterface() {
    _classCallCheck(this, ConnectorInterface);
  }

  _createClass(ConnectorInterface, [{
    key: 'authorize',

    /*
     * initialize this connector with existing authorization information
     * @param {<AuthorizationStore>} authorization - the users authorization
     */
    value: function authorize(authorization) {}

    /*
     * control a user through the authorization flow
     * @param {AuthorizationStore} authorization - the users authorization
     */
  }, {
    key: 'recieveBounce',
    value: function recieveBounce(authorization) {}
  }]);

  return ConnectorInterface;
})();

exports['default'] = ConnectorInterface;
module.exports = exports['default'];
//# sourceMappingURL=connector_interface.js.map