'use strict';

// Imports
const ChromeDownloader = require('../../lib/chrome-downloader');
const Logger = require('../../lib/logger');

// Constants
const endpoint = 'https://chrome-downloader.herokuapp.com';

/**
 * @class Release
 * @property {string} osTarget
 * @property {string} version
 * @property {string} basePosition
 * @property {string} downloadableEndpoint
 * @property {boolean} downloaded
 */

function service(
  $http,
  $q
) {
  return class ReleasesServices {
    /**
     * @param {Release} release
     * @param {boolean} [unsecure=false]
     * @return {Promise}
     */
    static run(release, unsecure) {
      return $q((resolve, reject) => {
        ChromeDownloader
          .run(release.osTarget, release.version, unsecure)
          .then(resolve)
          .catch(reject);
      });
    }

    /**
     * @param {Release} release
     * @param {boolean} [unsecure=false]
     * @return {Promise}
     */
    static createShortLink(release, unsecure) {
      return $q((resolve, reject) => {
        ChromeDownloader
          .createShortLink(release.osTarget, release.version, unsecure)
          .then(resolve)
          .catch(reject);
      });
    }

    /**
     * @param {Release} release
     * @return {Promise}
     */
    static downloadRelease(release) {
      return $q((resolve, reject) => {
        ChromeDownloader
          .downloadVersion(release.version, release.downloadableEndpoint)
          .then(resolve)
          .catch(reject);
      });
    }

    /**
     * @param {string} osTarget
     * @return {Promise<Release[]>}
     */
    static fetchReleases(osTarget) {
      Logger.info('We will load releases for the os target %s', osTarget);

      return $http
        .get(`${endpoint}/releases/${osTarget}/downloadable`)
        .then(response => response.data)
        .then(releases => {
          Logger.debug('We have found %s releases', releases.length);
          let downloadedVersions = ChromeDownloader.loadContext().downloadedVersions;

          return releases.map(release => {
            return Object.assign(release, { 'downloaded': !!downloadedVersions.find(downloadedVersion => downloadedVersion === release.version) });
          });
        })
        .catch(err => {
          Logger.error(err);
          return $q.reject(err);
        });
    }
  };
}

service.$inject = [
  '$http',
  '$q'
];

module.exports = service;
