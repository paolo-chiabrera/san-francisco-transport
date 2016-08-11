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
});
