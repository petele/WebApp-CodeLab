/* http://docs-next.angularjs.org/api/angular.module.ng.$filter */

angular.module('wReader.filters', []).
  filter('formattedDate', function() {
    return function(d) {
      return d ? moment(d).fromNow() : '';
    }
  }).
  filter('formattedFullDate', function() {
    return function(d) {
      return d ? moment(d).format('MMMM Do YYYY, h:mm a') : '';
    }
  });
