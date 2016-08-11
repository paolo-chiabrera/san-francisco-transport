import _ from 'lodash';

class RoutePickerController {
  /** @ngInject */
  constructor($q, $rootScope, FeedService) {
    // imports
    this.$q = $q;
    this.$rootScope = $rootScope;
    this.FeedService = FeedService;

    this.routeTags = [];
    this.routeColors = {};
    this.selectedTags = {};
    this.searchText = '';
  }

  changedTag() {
    const tags = _.reduce(this.selectedTags, (result, value, key) => {
      if(value === true) result.push(key);
      return result;
    }, []);

    this.$rootScope.$broadcast('tags', tags);
  }

  $onInit() {
    this.$rootScope.$on('routes', (ev, routes) => {
      this.routeColors = routes;
      this.routeTags = _.keys(routes);
    });
  }
}

export default {
  templateUrl: 'app/route-picker/route-picker.html',
  controller: RoutePickerController
};
