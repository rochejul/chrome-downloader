'use strict';

// Imports
const ChromeDownloader = require('../../lib/chrome-downloader');

function service(
) {
  return class ConfigurationService {
    /**
     * @returns {boolean}
     */
    static isFilterDownloadedRelease() {
      return ChromeDownloader.loadContext().filterDownloadedRelease;
    }
  };
}

service.$inject = [
];

module.exports = service;
