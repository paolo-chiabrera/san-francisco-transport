import angular from 'angular';
import 'angular-mocks';
import header from './header';

describe('header component', () => {
  beforeEach(() => {
    angular
      .module('app', ['app/header/header.html'])
      .component('headerCmp', header);
    angular.mock.module('app');
  });

  it('should render \'San Francisco Transport\'', angular.mock.inject(($rootScope, $compile) => {
    const element = $compile('<header-cmp></header-cmp>')($rootScope);
    $rootScope.$digest();
    const header = element.find('a');
    expect(header.html().trim()).toEqual('San Francisco Transport');
    expect(header.attr('href').trim()).toEqual('http://sft.d3lirium.eu/');
  }));
});
