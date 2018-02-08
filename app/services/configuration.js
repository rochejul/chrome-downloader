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

    /**
     * @returns {boolean}
     */
    static isFilterByVersions() {
      return ChromeDownloader.loadContext().filterVersions;
    }
  };
}

service.$inject = [
];

module.exports = service;
