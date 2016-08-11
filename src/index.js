import angular from 'angular';

// Local Storage
import localStorageModule from 'angular-local-storage';

import main from './app/main';
import header from './app/header/header';

import FeedService from './app/feed/feed.service';

import map from './app/map/map';
import routePicker from './app/route-picker/route-picker';

import './index.scss';

angular
  .module('app', [localStorageModule])
  /** @ngInject */
  .config(($httpProvider, localStorageServiceProvider) => {
    $httpProvider.defaults.useXDomain = true;
    localStorageServiceProvider.setPrefix('sft');
  })
  .service('FeedService', FeedService)
  .component('app', main)
  .component('headerCmp', header)
  .component('routePicker', routePicker)
  .component('map', map);
