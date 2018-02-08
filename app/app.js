'use strict';

const angular = require('angular');

angular
  .module(
    'ChromeDownloaderGuiApp',
    [
    ]
  )
  .constant('OsTargetConstants', require('./constants/os-target'))
  .controller('MainController', require('./controllers/main'))
  .factory('ConfigurationService', require('./services/configuration'))
  .factory('ReleasesService', require('./services/releases'))
  .factory('DialogsService', require('./services/dialogs'))
  .factory('SystemService', require('./services/system'))
;
