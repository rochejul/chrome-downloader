'use strict';

const { ipcRenderer } = require('electron');

class MainController {
  constructor(
    $timeout,
    DialogsService,
    OsTargetConstants,
    ReleasesService,
    SystemService
  ) {
    this.isMac = SystemService.isMac();
    this.loading = true;
    this.downloadingInProgress = false;
    this.majorError = false;

    this.osTarget = OsTargetConstants[SystemService.getCurrentSystem()];
    this.releases = [];
    this.versionToDownload = null;
    this.showOnlyDownloadedRelease = false;

    this.ReleasesService = ReleasesService;
    this.DialogsService = DialogsService;

    ReleasesService
      .fetchReleases(this.osTarget.target)
      .then(releases => {
        this.releases = releases;
      })
      .catch(() => {
        this.majorError = true;
      })
      .then(() => {
        this.loading = false;
      });

    ipcRenderer.on('ipcEventProject--menu-view-display-only-downloaded-release', (event, state) => { // TODO should unbind on $destroy event
      $timeout(() => {
        this.showOnlyDownloadedRelease = state;
      });
    });
  }

  /**
   * @param {Release} release
   * @param {boolean} [unsecure=false]
   * @return {Promise}
   */
  run(release, unsecure) {
    return this.ReleasesService
      .run(release, unsecure)
      .then(() => {
        new Notification(
          `${release.version} (${unsecure ? 'unsafe' : 'safe'} mode) was launched`
        );
      })
      .catch(() => {
        this.DialogsService.error('An error occured. Please see logs for inspection');
      });
  }

  /**
   * @param {Release} release
   * @param {boolean} [unsecure=false]
   * @return {Promise}
   */
  createShortLink(release, unsecure) {
    return this.ReleasesService
      .createShortLink(release, unsecure)
      .then(() => {
        new Notification(
          `Shortcut for ${release.version} created`,
          {
            'body': `The shortcut version ${release.version} was successfully created.${unsecure ? ' This will include an unsecure mode.' : ''}`,
            'sound': true,
            'vibrate': true
          }
        );
      })
      .catch(() => {
        this.DialogsService.error('An error occured. Please see logs for inspection');
      });
  }

  /**
   * @param {Release} release
   * @returns {Promise}
   */
  downloadRelease(release) {
    this.versionToDownload = release.version;
    this.downloadingInProgress = true;

    return this.ReleasesService
      .downloadRelease(release)
      .then(() => {
        release.downloaded = true;
        new Notification(
          `Version ${release.version} downloaded`,
          {
            'body': `The version ${release.version} was successfully downloaded. You could now create a shortcut on your desktop.`,
            'sound': true,
            'vibrate': true
          }
        );
      })
      .catch(err => {
        this.DialogsService.error('An error occured. Please see logs for inspection');
      })
      .then(() => {
        this.versionToDownload = null;
        this.downloadingInProgress = false;
      });
  }

  /**
   * @returns {boolean}
   */
  isDownloadingInProgress() {
    return this.downloadingInProgress;
  }

  /**
   * @returns {boolean}
   */
  isVersionDownloadingInProgress(version) {
    return this.versionToDownload === version;
  }

  /**
   * @returns {boolean}
   */
  shouldDisplayContent() {
    return !this.shouldDisplayGlobalError() && !this.shouldDisplayLoading();
  }

  /**
   * @returns {boolean}
   */
  shouldDisplayGlobalError() {
    return this.majorError;
  }

  /**
   * @returns {boolean}
   */
  shouldDisplayLoading() {
    return this.loading;
  }
}

MainController.$inject = [
  '$timeout',
  'DialogsService',
  'OsTargetConstants',
  'ReleasesService',
  'SystemService'
];

module.exports = MainController;
