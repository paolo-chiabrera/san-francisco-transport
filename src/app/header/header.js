class HeaderController {
  constructor($rootScope) {
    // imports
    this.$rootScope = $rootScope;
    this.lastUpdate = null;
  }

  $onInit() {
    this.$rootScope.$on('vehicles', () => {
      this.lastUpdate = (new Date()).toString();
    });
  }
}

export default {
  templateUrl: 'app/header/header.html',
  controller: HeaderController
};
