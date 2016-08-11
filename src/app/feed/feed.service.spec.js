import FeedService from './feed.service';

let feedService;

describe('feed service', () => {

  beforeEach(() => {
    feedService = new FeedService();
  });

  it('should do defined', function() {
    expect(feedService).toBeDefined();
  });

  it('should have all the properties set', function() {
    expect(feedService.baseUrl).toEqual('http://webservices.nextbus.com/service/publicXMLFeed');
    expect(feedService.routes).toEqual({});
    expect(feedService.bounds).toEqual(null);
    expect(feedService.expiration).toEqual(15 * 1000);
    expect(feedService.etags).toEqual({
      routes: 'routes',
      vehicles: 'vehicles'
    });
  });

  it('should expose all the methods', function() {
    expect(feedService.parseXML).toEqual(jasmine.any(Function));
    expect(feedService.getRouteColor).toEqual(jasmine.any(Function));
    expect(feedService.getRandomColor).toEqual(jasmine.any(Function));
    expect(feedService.get).toEqual(jasmine.any(Function));
    expect(feedService.getAgencyList).toEqual(jasmine.any(Function));
    expect(feedService.getVehicleLocations).toEqual(jasmine.any(Function));
    expect(feedService.filterVehicles).toEqual(jasmine.any(Function));
    expect(feedService.extractData).toEqual(jasmine.any(Function));
    expect(feedService.getAllVehicles).toEqual(jasmine.any(Function));
    expect(feedService.setBounds).toEqual(jasmine.any(Function));
    expect(feedService.init).toEqual(jasmine.any(Function));
  });
});
