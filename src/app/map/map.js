import {easeLinear, event, geoBounds, geoCentroid, geoMercator, geoPath, json, select, selectAll, transition, zoom} from 'd3';
import _ from 'lodash';

class MapController {
  /** @ngInject */
  constructor($log, $rootScope, FeedService) {
    // imports
    this.$log = $log;
    this.$rootScope = $rootScope;
    this.FeedService = FeedService;

    this.id = 'sf-map';

    this.map = {
      width: 0,
      height: 0
    };

    this.vehicleConfig = {
      radius: {
        normal: 3,
        selected: 6
      },
      opacity: {
        normal: .1,
        selected: 1
      }
    }

    this.selectedRouteTags = [];

    // d3
    this.svg = {};

    this.projection = geoMercator();
    this.path = geoPath().projection(this.projection);

    this.container = null;

    this.zoom = zoom().scaleExtent([1, 10]).on('zoom', () => {
      const t = event.transform;
      this.container.attr('transform', 'translate(' + t.x + ',' + t.y + ')scale(' + t.k + ')');
    });

    this.transitions = {
      in: transition().duration(500).ease(easeLinear),
      out: transition().duration(300).ease(easeLinear),
      move: transition().duration(1200).ease(easeLinear)
    };

    this.vehiclesLayer = null;
    this.mapLayer = null;

    this.initMap();
  }

  setProjection(json) {
    const width = this.map.width;
    const height = this.map.height;

    const center = geoCentroid(json)
    let scale  = 150;
    let offset = [width/2, height/2];

    const projection = geoMercator().scale(scale).center(center).translate(offset);
    const path = geoPath().projection(projection);

    const bounds  = path.bounds(json);

    const k = 70;

    const hscale  = scale*width  / (bounds[1][0] - bounds[0][0]);
    const vscale  = scale*height / (bounds[1][1] - bounds[0][1]);
    scale = (hscale < vscale) ? hscale : vscale;
    offset  = [width - (bounds[0][0] + bounds[1][0])/2, height - (bounds[0][1] + bounds[1][1])/2 + k];

    this.projection.center(center).scale(scale).translate(offset);
    this.path = geoPath().projection(this.projection);
  }

  drawMap(json, color = '#888') {
    this.mapLayer
    .selectAll('path')
    .data(json.features)
    .enter()
    .append('path')
    .attr('d', this.path)
    .attr('class', 'feature')
    .style('fill', 'none')
    .style('stroke-width', .5)
    .style('stroke', color);
  }

  selectRouteTags(routeTags = []) {

    if (_.isEmpty(routeTags) || _.isEqual(routeTags, this.selectedRouteTags)) {
      // reset all vehicles to default
      this.selectedRouteTags = [];
      selectAll('circle')
      .attr('r', this.vehicleConfig.radius.normal)
      .style('fill-opacity', 1);
      return;
    }

    this.selectedRouteTags = routeTags;

    // hide all the unselected
    const selectorNot = _.map(this.selectedRouteTags, routeTag => 'circle:not([route-tag="' + routeTag + '"])').join(',');

    selectAll(selectorNot)
    .attr('r', this.vehicleConfig.radius.normal)
    .style('fill-opacity', this.vehicleConfig.opacity.normal);

    // select all the matching vehicles
    const selector = _.map(this.selectedRouteTags, routeTag => 'circle[route-tag="' + routeTag + '"]').join(',');

    selectAll(selector)
    .each(function() {
      this.parentNode.appendChild(this);
    })
    .transition(this.transitions.in)
    .attr('r', this.vehicleConfig.radius.selected)
    .style('fill-opacity', this.vehicleConfig.opacity.selected);

    this.$log.debug('selected route --> ' + this.selectedRouteTags.join(', '));
  }

  getRadius(d) {
    const key = (this.selectedRouteTags.indexOf(d.routeTag) >= 0) ? 'selected' : 'normal';
    return this.vehicleConfig.radius[key];
  }

  getOpacity(d) {
    if (_.isEmpty(this.selectedRouteTags)) return 1;
    const key = (this.selectedRouteTags.indexOf(d.routeTag) >= 0) ? 'selected' : 'normal';
    return this.vehicleConfig.opacity[key];
  }

  drawVehicles(data) {

    const vehicles = this.vehiclesLayer
    .selectAll('circle')
    .data(data, d => d.id);

    // update old ones
    vehicles
    .transition(this.transitions.move)
    .attr('cx', d => this.projection([d.lon, d.lat])[0])
    .attr('cy', d => this.projection([d.lon, d.lat])[1]);

    // exit old elements
    vehicles
    .exit()
    .remove();

    // handle the new ones
    vehicles
    .enter()
    .append('circle')
    .attr('class', 'vehicle')
    .attr('route-tag', d => d.routeTag)
    .attr('r', d => this.getRadius(d))
    .attr('cx', d => this.projection([d.lon, d.lat])[0])
    .attr('cy', d => this.projection([d.lon, d.lat])[1])
    .style('fill', d => this.FeedService.getRouteColor(d.routeTag))
    .style('fill-opacity', d => this.getOpacity(d))
    .style('stroke-width', .5)
    .style('stroke', 'black')
    .on('click', d => {
      this.selectRouteTags([d.routeTag]);
    });

    this.$log.debug('displayed vehicles --> ' + vehicles._groups[0].length);
  }

  initMap() {

    const elem = document.getElementById(this.id);

    this.map.width = elem.offsetWidth;
    this.map.height = elem.offsetHeight;

    this.svg = select(elem)
    .append('svg')
    .attr('width', this.map.width)
    .attr('height', this.map.height)
    .call(this.zoom);

    this.container = this.svg.append('g');

    this.mapLayer = this.container.append('g').attr('class', 'map-layer');

    this.vehiclesLayer = this.container.append('g').attr('class', 'vehicles-layer');

    json('/app/json/streets.json', (err, json) => {
      if (err) {
        this.$log.error(err);
        return
      }

      this.bounds = geoBounds(json);

      this.setProjection(json);

      this.drawMap(json);

      this.FeedService.init(this.bounds);
    });
  }

  $onInit() {

    this.$rootScope.$on('vehicles', (ev, vehicles) => {

      this.vehicles = vehicles;

      this.$log.debug('updated vehicles --> ' + this.vehicles.length);

      this.drawVehicles(this.vehicles);
    });

    this.$rootScope.$on('tags', (ev, tags) => {
      this.selectRouteTags(tags);
    });
  }
}

export default {
  templateUrl: 'app/map/map.html',
  controller: MapController
};
