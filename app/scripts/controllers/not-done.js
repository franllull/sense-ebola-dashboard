'use strict';

angular.module('sedApp')
  .controller('NotDoneCtrl', function($rootScope, $scope, $filter, ngTableParams, dataLoader) {

    var locals = $scope.locals = {
      totalItems: 0,
      currentPage: 1,
      tableParams: new ngTableParams({
        page: 1,
        count: 10
      }, {
        total: 0,
        counts: [],
        getData: function($defer, params) {
          var contactData = dataLoader.contactData();
          console.log(contactData);

          var data = contactData ? contactData.contactsInfo : [];
          locals.totalItems = data.length;
          $defer.resolve(data.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        }
      })
    };

    $rootScope.$on('dataUpdated', function() {
      locals.tableParams.reload();
    });
  });