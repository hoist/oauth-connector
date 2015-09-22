/**
 * @interface
 */
export default class AuthorizationStore {

  /**
   * the query params the user is currently showing
   * @type {object}
   */
  get query() {};
  /**
   * sets and saves a value against the store
   * @param {string} key - the key to store the value against
   * @param {object} value - the value to store
   * @returns {Promise} - a promise to have saved the value
   */
  set(key, value) {

  }

  /**
   * gets a value saved against the specified key
   *
   * @param {string} key - the key the value is saved against
   * @returns {object} - the value at the specified key or null
   */
  get(key) {

  }

  /**
   * removes any value saved against the specified key permanently
   * @param {string} key - the key the value is saved against
   * @returns {Promise} - a promise to have deleted the value from the store
   */
  delete(key) {

  }

  /**
   * mark the current authorization flow as complete i.e. after having swapped all access tokens and request tokens
   * @returns {undefined}
   */
  done() {

  }


  /**
   * redirect the user to the specified uri
   * the user is no longer present after this call so should only happen at the end of a flow
   * @param {string} uri - the uri to redirect the user to
   * @returns {undefined}
   */
  redirect(uri) {

  }


}
