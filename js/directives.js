/* global moment */
/* global myApp */

myApp.directive('chartTypePicker', function() {
  var directive = {
    templateUrl: 'partials/dashboard-chart-picker.html'
  };
  
  return directive;
});

myApp.directive('dashboardSectionSummary', function() {
  var directive = {
    restrict: 'E',
    templateUrl: 'partials/dashboard-section-summary.html'
  };

  return directive;
});

myApp.directive('dashboardSectionIls', function() {
  var directive = {
    restrict: 'E',
    templateUrl: 'partials/dashboard-section-ils.html'
  };

  return directive;
});

myApp.directive('dashboardSectionEmaterials', function() {
  var directive = {
    restrict: 'E',
    templateUrl: 'partials/dashboard-section-ematerials.html'
  };

  return directive;
});

myApp.directive('dashboardSectionTechnology', function() {
  var directive = {
    restrict: 'E',
    templateUrl: 'partials/dashboard-section-technology.html'
  };

  return directive;
});

myApp.directive('dashboardSummary', function() {
  var directive = {
    restrict: 'E',
    scope: {},
    controller: function($scope, $controller, $attrs, $http, $filter, $sce, chartDataFactory) {
      renderSummary();
      $scope.$watch('$parent.code', renderSummary);
      $scope.$watch('$parent.datepicker.date', renderSummary);
      
      function renderSummary() {
        var metrics = $attrs.metrics.split(',');
        var metricDisplayNames = [];
        if($attrs.metricDisplayNames) {
          metricDisplayNames = $attrs.metricDisplayNames.split(',');
        }
        
        $scope.highlight = {
          display: _.first(metricDisplayNames) || _.first(metrics),
          waiting: $sce.trustAsHtml('<i class="fa fa-spinner fa-spin"></i>')
        };
        
        chartDataFactory.getData({
          start: moment($scope.$parent.datepicker.date.startDate).format('MM-DD-YYYY'),
          end: moment($scope.$parent.datepicker.date.endDate).format('MM-DD-YYYY'),
          code: $scope.$parent.code,
          action: _.first(metrics)
        }).then(function(data) {
          $scope.highlight.waiting = '';
          $scope.highlight.data = data.data[0];
        });

        $scope.metrics = _.map(_.rest(metrics), function(metric, index) {
          return {name: metric, display: metricDisplayNames[index + 1] || metric};
        });
        
        _.each($scope.metrics, function(metric, index) {
          $scope.metrics[index].waiting = $sce.trustAsHtml('<i class="fa fa-spinner fa-spin"></i>');
          var options = {};
          options.start = moment($scope.$parent.datepicker.date.startDate).format('MM-DD-YYYY');
          options.end = moment($scope.$parent.datepicker.date.endDate).format('MM-DD-YYYY');
          options.code = $scope.$parent.code;
          options.action = metric.name;
          
          chartDataFactory.getData(options).then(function(data) {
            $scope.metrics[index].waiting = '';
            $scope.metrics[index].data = $filter('number')(data.data[0]);
          });
        })        
      } 
    },
    templateUrl: 'partials/dashboard-summary.html'
  };
  
  return directive;
});

myApp.directive('dashboardChart', function() {
  var counter = 0;
  var directive = {
    restrict: 'E',
    scope: {},
    controller: function($scope, $controller, $attrs, $http, $sce, chartDataFactory) {
      var initialCode = true;
      var initialDate = true;
      var originalData = [];
      
      $scope.options = {};
      $scope.options.title = $attrs.title;
      $scope.options.id = 'chart' + counter;
      $scope.options.action = $attrs.action.split(',');
      if($attrs.actionNames) {
        $scope.options.actionNames = $attrs.actionNames.split(',');  
        if(!_.isArray($scope.options.actionNames)){$scope.options.actionNames = [$scope.options.actionNames];};
      }
      $scope.options.by = $attrs.groupBy;
      $scope.options.format = $attrs.format;
      $scope.options.type = $attrs.type || 'Bar';
      $scope.options.legend = false;
      $scope.options.groups = $attrs.groups;
      $scope.options.code = $scope.$parent.code;
      $scope.options.start = moment($scope.$parent.datepicker.date.startDate).format('MM-DD-YYYY');
      $scope.options.end = moment($scope.$parent.datepicker.date.endDate).format('MM-DD-YYYY');
      $scope.showChart = true;
      $scope.toolbar = $attrs.hasOwnProperty('noToolbar') ? false : true;
      setIsLibrary();
      
      $scope.selectType = function(type) {
        $scope.options.type = type;
        $scope.options = chartDataFactory.processData($scope.options, originalData);
      };

      $scope.makeImage = function() {
        var img = $('#' + $scope.options.id)[0].toDataURL();
        var title = [$scope.options.title, ' (', $scope.options.start, ' - ', $scope.options.end, ')'].join('');
        $('#chart-image-title').text(title);
        $('#chart-image-image').attr('src', img);
        $('#chart-image-image').attr('alt', title);
        $('#chart-image').modal();
      }

      function getData() {
        $scope.showChart = false;
        $scope.waiting = true;
        originalData = [];
        if(!_.isArray($scope.options.action)) {$scope.options.action = [$scope.options.action];}
        var options = angular.extend({}, $scope.options);
        var returnedResults = 0;
        
        _.each($scope.options.action, function(action, index) {
          chartDataFactory.getData(options, action).then(function(data) {
            var display = $scope.options.actionNames ? $scope.options.actionNames[index] : action;
            originalData[index] = {action: action, display: display, labels: data.labels, data: data.data};
            returnedResults += 1;
            if(returnedResults === $scope.options.action.length) {
              $scope.waiting = false;
              $scope.showChart = true;
              $scope.options = chartDataFactory.processData(options, originalData);
            }         
          });         
        });
      };
      
      function setIsLibrary() {
        if(!$scope.options.code) {
          $scope.$parent.library = false;
        }
        else {
          $scope.$parent.library = true;
        }        
      }

      $scope.$watch('$parent.code', function(code) {
        if(initialCode) {
          initialCode = false;
        }
        else {
          $scope.options.code = code
          setIsLibrary();
          getData();
        }
      });

      $scope.$watch('$parent.datepicker.date', function(date) {
        if(initialDate) {
          initialDate = false;
        }
        else {
          $scope.options.start = moment(date.startDate).format('MM-DD-YYYY');
          $scope.options.end = moment(date.endDate).format('MM-DD-YYYY');
          if($scope.options.start && $scope.options.end) {
            getData();
          }
        }
      }, true);

      getData();
      counter += 1;
    },
    templateUrl: 'partials/dashboard-chart.html',
  };

  return directive;
});
