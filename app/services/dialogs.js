'use strict';

const { remote} = require('electron');
const dialog = remote.dialog;

function service(
) {
  return class DialogsService {
    /**
     * @param {string} message
     */
    static error(message) {
      dialog.showErrorBox('Error', message);
    }
  };
}

service.$inject = [
];

module.exports = service;
