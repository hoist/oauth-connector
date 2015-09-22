'use strict';

/**
 * @interface
 */
export default class ConnectorInterface {

  /*
   * initialize this connector with existing authorization information
   * @param {<AuthorizationStore>} authorization - the users authorization
   */
  authorize(authorization) {

  }

  /*
   * control a user through the authorization flow
   * @param {AuthorizationStore} authorization - the users authorization
   */
  recieveBounce(authorization) {

  }
}
