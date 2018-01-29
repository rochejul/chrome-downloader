'use strict';

const path = require('path');
const os = require('os');

const BASE_DIRECTORY_PATH = path.resolve(path.join(os.homedir(), '.chrome-downloader'));
const CONTEXT_FILE_PATH = path.resolve(path.join(BASE_DIRECTORY_PATH, './context.json'));
const TEMP_DIRECTORY_PATH = path.resolve(path.join(BASE_DIRECTORY_PATH, './temp'));
const LOGS_DIRECTORY_PATH = path.resolve(path.join(BASE_DIRECTORY_PATH, './logs'));

module.exports = Object.freeze({
  BASE_DIRECTORY_PATH,
  CONTEXT_FILE_PATH,
  TEMP_DIRECTORY_PATH,
  LOGS_DIRECTORY_PATH
});
