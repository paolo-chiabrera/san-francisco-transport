import _ from 'lodash';
import {parseString} from 'xml2js';
import {mapLimit, waterfall} from 'async';

export default class FeedService {
  /** @ngInject */
  constructor($http, $q, $rootScope, localStorageService) {
    this.$http = $http;
    this.$q = $q;
    this.$rootScope = $rootScope;
    this.localStorageService = localStorageService;

    this.baseUrl = 'http://webservices.nextbus.com/service/publicXMLFeed';

    this.routes = {};
    this.bounds = null;

    this.expiration = 15 * 1000;

    // events
    this.etags = {
      routes: 'routes',
      vehicles: 'vehicles'
    };
  }

  parseXML(xml) {
    const deferred = this.$q.defer();

    parseString(xml, {trim: true}, function (err, result) {
      if (err) {
        deferred.reject(err);
        return;
      }

      deferred.resolve(result);
    });

    return deferred.promise;
  }

  getRouteColor(routeTag) {
    return this.routes[routeTag];
  }

  getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++ ) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  get(params = {}) {
    return this.$http({
      url: this.baseUrl,
      method: 'GET',
      params: params
    }).then(res => this.parseXML(res.data));
  }

  getAgencyList(callback) {

    const agencyListCached = this.localStorageService.get('agencyList');

    if (_.isObject(agencyListCached)) {
      setTimeout(function () {
        callback(null, {
          agencyList: agencyListCached
        });
      }, 10);
    } else {
      this.get({
        command: 'agencyList'
      }).then(res => {

        const agencyList = _.map(res.body.agency, agency => agency.$);

        this.localStorageService.set('agencyList', agencyList);

        callback(null, {
          agencyList: agencyList
        });
      }, callback);
    }
  }

  getVehicleLocations(obj = {}, callback) {

    const vehicles = [];

    mapLimit(obj.agencyList, 8, (agency, nextAgency) => {
      this.get({
        command: 'vehicleLocations',
        a: agency.tag
      }).then(res => {
        _.each(res.body.vehicle, vehicle => vehicles.push(vehicle.$));
        nextAgency(null);
      }, nextAgency);
    }, err => {
      if (err) {
        callback(err);
        return;
      }

      callback(null, vehicles);
    });
  }

  filterVehicles(vehicles) {

    if (!_.isObject(this.bounds)) {
      return vehicles
    }

    return _.filter(vehicles, vehicle => {
      const lat = parseFloat(vehicle.lat);
      const lon = parseFloat(vehicle.lon);
      return (
        lon >= this.bounds.lon_min &&
        lon <= this.bounds.lon_max &&
        lat >= this.bounds.lat_min &&
        lat <= this.bounds.lat_max
      );
    });
  }

  extractData(vehicles = []) {

    if (_.isEmpty(vehicles)) return;

    const vehiclesFiltered = this.filterVehicles(vehicles);

    const tags = _.chain(vehiclesFiltered).map('routeTag').uniq().value();

    _.each(tags, routeTag => {
      if(!this.routes[routeTag]) this.routes[routeTag] = this.getRandomColor();
    });

    this.$rootScope.$broadcast(this.etags.routes, this.routes);

    this.$rootScope.$broadcast(this.etags.vehicles, vehiclesFiltered);
  }

  getAllVehicles() {
    const deferred = this.$q.defer();

    waterfall([
      this.getAgencyList.bind(this),
      this.getVehicleLocations.bind(this)
    ], (err, vehicles) => {
      if (err) {
        deferred.reject(err);
        return;
      }

      this.extractData(vehicles);

      deferred.resolve(vehicles);
    });

    return deferred.promise;
  }

  setBounds(bounds = null) {
    if (_.isArray(bounds)) {
      this.bounds = {
        lon_min: parseFloat(bounds[0][0]),
        lon_max: parseFloat(bounds[1][0]),
        lat_min: parseFloat(bounds[0][1]),
        lat_max: parseFloat(bounds[1][1])
      };
    }
  }

  init(bounds) {

    this.setBounds(bounds);

    this.getAllVehicles();

    setInterval(() => {
      this.getAllVehicles();
    }, this.expiration);
  }
}
