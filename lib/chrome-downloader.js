'use strict';

// Imports
const fs = require('fs');
const path = require('path');

const request = require('request');
const unzip = require('unzip');
const rimraf = require('rimraf');

const Constants = require('./constants');
const Logger = require('./logger');
const System = require('./system');

// Constants
const DOT_CODE = '.';
const DEFAULT_RC_CONTENT = Object.freeze({
  'filterDownloadedRelease': false,
  'lastUpdate': null,
  'downloadedVersions': []
});

/**
 * @class ChromeDownloaderContext
 * @property {boolean}  filterDownloadedRelease
 * @property {string}  lastUpdate
 * @property {string[]}  downloadedVersions
 */

/**
 * @private
 * @param {string} chromeVersion1
 * @param {string} chromeVersion2
 * @returns {number} -1, 0 or 1
 */
function compareChromeVersion(chromeVersion1, chromeVersion2) {
  let numbers1 = chromeVersion1.split(DOT_CODE);
  let numbers2 = chromeVersion2.split(DOT_CODE);

  for (let i = 0; i < numbers1.length; ++i) {
    let na = parseInt(numbers1[i], 10);
    let nb = parseInt(numbers2[i], 10);

    if (na > nb) {
      return 1;
    }

    if (nb > na) {
      return -1;
    }

    if (!isNaN(na) && isNaN(nb)) {
      return 1;
    }

    if (isNaN(na) && !isNaN(nb)) {
      return -1;
    }
  }

  return 0;
}

/**
 * @private
 * @param {string} version
 * @param {string} downloadableEndpoint
 * @return {Promise.<string>} Downloaded file path
 */
function downloadChrome(version, downloadableEndpoint) {
  return new Promise((resolve, reject) => {
    let dest = path.resolve(path.join(Constants.TEMP_DIRECTORY_PATH, `${version}.zip`));

    Logger.info('Download on the endpoint %s', downloadableEndpoint);

    try {
      let writeStream = fs.createWriteStream(dest);

      writeStream.on('finish', () => {
        Logger.debug('Downloaded zip for version %s', version);
        Logger.debug('Will be find on the following path: %s', dest);
        resolve(dest);
      });
      writeStream.on('error', err => {
        Logger.error(err);
        fs.unlink(dest, reject.bind(null, err));
      });

      let readStream = request.get(downloadableEndpoint);
      readStream.on('error', err => {
        Logger.error(err);
        fs.unlink(dest, reject.bind(null, err));
      });
      readStream.pipe(writeStream);

    } catch (err) {
      fs.unlink(dest, reject.bind(null, err));
      Logger.error(err);
    }
  });
}

/**
 * @param {string} filePath
 * @return {Promise.<any>}
 */
function removeChromeFolder(filePath) {
  return new Promise(resolve => {
    rimraf(filePath, resolve);
  });
}

/**
 * @param {string} filePath
 * @param {string} version
 * @return {Promise.<any>}
 */
function unzipChrome(filePath, version) {
  return new Promise((resolve, reject) => {
    let outputPath = path.resolve(path.join(Constants.BASE_DIRECTORY_PATH, `./${version}`));

    Logger.info('Unzip the downloaded version %s to the following path: %s', version, outputPath);

    try {
      fs
        .createReadStream(filePath)
        .pipe(unzip.Extract({ 'path': outputPath }))
        .on('finish', () => {
          Logger.debug('Installed version %s', version);
          Logger.debug('Installed on the following path: %s', outputPath);

          fs.unlink(filePath);
          resolve(outputPath);
        })
        .on('error', err => {
          Logger.error(err);
          fs.unlink(filePath);

          removeChromeFolder(outputPath)
            .then(() => reject(err))
            .catch(err2 => {
              Logger.error(err2);
              reject(err2);
            });
        });

    } catch (err) {
      Logger.error(err);
      fs.unlink(filePath);

      removeChromeFolder(outputPath)
        .then(() => reject(err))
        .catch(err2 => {
          Logger.error(err2);
          reject(err2);
        });
    }
  });
}

/**
 * @private
 * @param {string} osTarget
 * @param {string} version
 * @param {boolean} [unsecure=false]
 * @return {{ chromePath: string, chromeArguments: string[] }}
 */
function getReleaseInstallationInformation(osTarget, version, unsecure) {
  let chromePath = path.resolve(path.join(Constants.BASE_DIRECTORY_PATH, `./${version}`));
  let chromeProfilePath = path.resolve(path.join(chromePath, './userprofile'));
  let chromeArguments = [];

  if (unsecure) {
    Logger.debug('This link will include an insecure mode');
    chromeProfilePath += '-unsecure';
  }

  switch (osTarget) {
    case 'Mac':
      chromePath = path.resolve(path.join(chromePath, './chrome-mac/Chromium.app'));
      break;

    case 'Linux_x32':
    case 'Linux_x64':
      chromePath = path.resolve(path.join(chromePath, './chrome-linux/chrome.exe'));
      break;

    case 'Win_x32':
    case 'Win_x64':
      chromePath = path.resolve(path.join(chromePath, './chrome-win32/chrome.exe'));
      break;
  }

  chromePath = chromePath.replace(/\\/g, '/');
  chromeProfilePath = chromeProfilePath.replace(/\\/g, '/');

  chromeArguments.push(`--user-data-dir=${chromeProfilePath}`);

  if (unsecure) {
    chromeArguments.push('--disable-web-security');
    chromeArguments.push('-–allow-file-access-from-files');
  }

  return { chromePath, chromeArguments };
}

class ChromeDownloader {
  /**
   * @param {string} version
   */
  static addDownloadedVersion(version) {
    Logger.info('Save the version %s into the context', version);

    let context = ChromeDownloader.loadContext();
    context.downloadedVersions.push(version);

    context.downloadedVersions = context.downloadedVersions
      .sort(compareChromeVersion)
      .reverse();

    ChromeDownloader.saveContext(context);
  }

  /**
   * @param {string} osTarget
   * @param {string} version
   * @param {boolean} [unsecure=false]
   * @return {Promise.<any>}
   */
  static run(osTarget, version, unsecure) {
    Logger.info('Run version %s', version);
    let { chromePath, chromeArguments } = getReleaseInstallationInformation(osTarget, version, unsecure);

    return System
      .run(
        chromePath,
        chromeArguments
      )
      .catch(err => {
        Logger.error(err);
        return Promise.reject(err);
      });
  }

  /**
   * @param {string} osTarget
   * @param {string} version
   * @param {boolean} [unsecure=false]
   * @return {Promise.<any>}
   */
  static createShortLink(osTarget, version, unsecure) {
    Logger.info('Create link for version %s', version);
    let { chromePath, chromeArguments } = getReleaseInstallationInformation(osTarget, version, unsecure);

    return System
      .createShortLink(
        `Chrome-${version}${unsecure ? '-unsecure' : ''}`,
        chromePath,
        chromeArguments
      )
      .catch(err => {
        Logger.error(err);
        return Promise.reject(err);
      });
  }

  /**
   * @param {string} version
   * @param {string} downloadableEndpoint
   * @return {Promise.<any>}
   */
  static downloadVersion(version, downloadableEndpoint) {
    Logger.info('Start to download the expected version %s', version);

    return downloadChrome(version, downloadableEndpoint)
      .then(filePath => unzipChrome(filePath, version))
      .then(outputPath => {
        ChromeDownloader.addDownloadedVersion(version);

        // Create user profiles folder
        fs.mkdirSync(path.resolve(path.join(outputPath, './userprofile')));
        fs.mkdirSync(path.resolve(path.join(outputPath, './userprofile-unsecure')));

        Logger.info('Finish to download the expected version %s', version);
      });
  }

  static initDefaultRcFile() {
    // If not exists, we create the file
    if (!fs.existsSync(Constants.BASE_DIRECTORY_PATH)) {
      // Create the base folder
      fs.mkdirSync(Constants.BASE_DIRECTORY_PATH);

      // Create the contexts file
      ChromeDownloader.saveContext(DEFAULT_RC_CONTENT);

      // Create the temporary folder
      fs.mkdirSync(Constants.TEMP_DIRECTORY_PATH);

      // Create the logs folder
      fs.mkdirSync(Constants.LOGS_DIRECTORY_PATH);

      Logger.info('Setup for the first time ending');

    } else {
      Logger.info('Update the configuration file if needed');

      let context = ChromeDownloader.loadContext();
      let updatedContext = Object.assign(
        { },
        DEFAULT_RC_CONTENT,
        context
      );

      ChromeDownloader.saveContext(updatedContext);
    }
  }

  /**
   * @returns {ChromeDownloaderContext}
   */
  static loadContext() {
    return JSON.parse(fs.readFileSync(Constants.CONTEXT_FILE_PATH));
  }

  /**
   * @param {ChromeDownloaderContext} context
   */
  static saveContext(context) {
    let date = new Date().toString();

    fs.writeFileSync(
      Constants.CONTEXT_FILE_PATH,
      JSON.stringify(
        Object.assign({ }, context, { 'lastUpdate': date }),
        null,
        3
      )
    );

    Logger.info('Context save on %s', date);
  }
}

module.exports = ChromeDownloader;
