'use strict';

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const Constants = require('./constants');

// Logger configuration
module.exports = new winston.Logger({
  'level': 'debug',
  'transports': [
    new winston.transports.Console(),
    new DailyRotateFile({
      'dirname': Constants.LOGS_DIRECTORY_PATH,
      'datePattern': 'yyyy-MM-dd.',
      'prepend': true
    })
  ]
});
