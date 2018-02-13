'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const childProcess = require('child_process');

const MAX_BUFFER = 20 * 1024 * 1024;

/**
 * @private
 * @param {string} command
 * @param {string[]} [command=[]]
 * @param {boolean} [detached=false]
 * @returns {Promise.<string>}
 */
function promisedSpawn(command, args, detached = false) {
  return new Promise(function (resolve, reject) {
    let stdout = '';
    let instance = childProcess.spawn(command, args ? args : [], { 'stdio': 'inherit', 'shell': true, 'maxBuffer': MAX_BUFFER, 'detached': detached });

    if (detached) {
      instance.unref();
      resolve();

    } else {
      instance.on('data', function(data) {
        stdout += data;
      });
      instance.on('error', reject);
      instance.on('close', (code) => {
        if (code) {
          reject(code);

        } else {
          resolve(stdout);
        }
      });
    }
  });
}

class SystemService {
  /**
   * @param {string} originalPath
   * @param {string[]} args
   * @return {Promise}
   */
  static run(originalPath, args) {
    return promisedSpawn(originalPath, args, true);
  }

  /**
   * @param {string} name
   * @param {string} originalPath
   * @param {string[]} args
   * @return {Promise}
   */
  static createShortLink(name, originalPath, args) {
    let platform = os.platform();
    let desktopPath = SystemService.getDesktopPath();

    if (platform === 'win32') {
      return promisedSpawn(
        'powershell',
        [
          `"$s=(New-Object -COM WScript.Shell).CreateShortcut('${desktopPath}/${name}.lnk');$s.TargetPath='${originalPath}';$s.Arguments='${args.join(' ')}';$s.Save()"`
        ]
      );
    }

    if (platform === 'linux') {
      let iconPath = `${desktopPath}/${name}.desktop`;
      fs.writeFileSync(
        iconPath,
        `[Desktop Entry]
Name=${name}
Exec=${originalPath} ${args.join(' ')}
Terminal=true
Type=Application
        `
      );

      return promisedSpawn(
        'chmod',
        [
          '+x',
          iconPath
        ]
      );
    }

    return Promise.reject('Cannot create a shortcut file on your system.');
  }

  /**
   * @returns {string}
   */
  static getCurrentSystem() {
    let arch = os.arch();
    let platform = os.platform();
    let target = null;

    switch(platform) {
      case 'win32':
        target = 'Win';
        break;

      case 'darwin':
        target = 'Mac';
        break;

      case 'linux':
        target = 'Linux';
        break;
    }

    return `${target}_${arch}`;
  }

  /**
   * @returns {string}
   */
  static getDesktopPath() {
    return path.join(os.homedir(), 'Desktop');
  }

  /**
   * @return {boolean}
   */
  static isMac() {
    return os.arch() === 'Mac';
  }
}

module.exports = SystemService;
