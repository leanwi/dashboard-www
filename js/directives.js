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

// myApp.directive('dashboardSummary', function() {
//   var directive = {
//     restrict: 'E',
//     scope: {},
//     controller: function($scope, $controller, $attrs, $http, $filter, $sce, chartDataFactory) {
//       renderSummary();
//       $scope.$watch('$parent.code', renderSummary);
//       $scope.$watch('$parent.datepicker.date', renderSummary);
      
//       function renderSummary() {
//         var metrics = $attrs.metrics.split(',');
//         var metricDisplayNames = [];
//         if($attrs.metricDisplayNames) {
//           metricDisplayNames = $attrs.metricDisplayNames.split(',');
//         }
        
//         $scope.highlight = {
//           display: _.first(metricDisplayNames) || _.first(metrics),
//           waiting: $sce.trustAsHtml('<i class="fa fa-spinner fa-spin"></i>')
//         };
        
//         chartDataFactory.getData({
//           start: moment($scope.$parent.datepicker.date.startDate).format('MM-DD-YYYY'),
//           end: moment($scope.$parent.datepicker.date.endDate).format('MM-DD-YYYY'),
//           code: $scope.$parent.code,
//           action: _.first(metrics)
//         }).then(function(data) {
//           $scope.highlight.waiting = '';
//           $scope.highlight.data = data.data[0];
//         });

//         $scope.metrics = _.map(_.rest(metrics), function(metric, index) {
//           return {name: metric, display: metricDisplayNames[index + 1] || metric};
//         });
        
//         _.each($scope.metrics, function(metric, index) {
//           $scope.metrics[index].waiting = $sce.trustAsHtml('<i class="fa fa-spinner fa-spin"></i>');
//           var options = {};
//           options.start = moment($scope.$parent.datepicker.date.startDate).format('MM-DD-YYYY');
//           options.end = moment($scope.$parent.datepicker.date.endDate).format('MM-DD-YYYY');
//           options.code = $scope.$parent.code;
//           options.action = metric.name;
          
//           chartDataFactory.getData(options).then(function(data) {
//             $scope.metrics[index].waiting = '';
//             $scope.metrics[index].data = $filter('number')(data.data[0]);
//           });
//         })        
//       } 
//     },
//     templateUrl: 'partials/dashboard-summary.html'
//   };
  
//   return directive;
// });

myApp.directive('dashboardChart', function() {
  var counter = 0;
  var directive = {
    restrict: 'E',
    scope: {},
    controller: function($scope, $attrs, chartDataFactory) {
      var initialCode = true;
      var initialDate = true;
      var chart = {options: {}};
      counter += 1;
      setIsLibrary();
      getData();    
      
      // $scope.options contains the options as needed by Chart.js
      $scope.options = {};
      $scope.options.title = chart.options.title;
      $scope.options.id = 'chart' + counter;
      $scope.options.type = chart.options.type;
      $scope.options.legend = chart.options.legend;
      $scope.showChart = true;
      $scope.toolbar = $attrs.hasOwnProperty('noToolbar') ? false : true;
      $scope.selectType = function(type) {
        chart.options.type = type;
        processData();
      };

      $scope.makeImage = function() {
        var img = $('#' + $scope.options.id)[0].toDataURL();
        var title = [$scope.options.title, ' (', moment($scope.$parent.datepicker.date.startDate).format('MM-DD-YYYY'), ' - ', moment($scope.$parent.datepicker.date.endDate).format('MM-DD-YYYY'), ')'].join('');
        $('#chart-image-title').text(title);
        $('#chart-image-image').attr('src', img);
        $('#chart-image-image').attr('alt', title);
        $('#chart-image').modal();
      }
      
      $scope.$watch('$parent.code', function(code) {
        if(initialCode) {
          initialCode = false;
        }
        else {
          setIsLibrary();
          getData();
        }
      });

      $scope.$watch('$parent.datepicker.date', function(date) {
        if(initialDate) {
          initialDate = false;
        }
        else {
          getData();    
        }
      }, true); 
      
      function createChartDefinition(opts) {
        if(!opts){opts = {};}
        var selectedDateAndCode = {
          code: opts.code || $scope.$parent.code, 
          start: opts.start || moment($scope.$parent.datepicker.date.startDate).format('MM-DD-YYYY'),
          end: opts.end || moment($scope.$parent.datepicker.date.endDate).format('MM-DD-YYYY') 
        };
        var rawSeries = angular.fromJson($attrs.series);
        var seriesDef = chartDataFactory.insertSelectedDateAndCode(rawSeries, selectedDateAndCode);
        chart.options.series = seriesDef;
        chart.options.format = $attrs.format;
        chart.options.title = $attrs.title;
        chart.options.groups = $attrs.groups;
        chart.options.type = $attrs.type || 'Bar'
        chart.options.legend = $attrs.legend || false;
      }     
      
      function getData() {
        createChartDefinition();
        chartDataFactory.getData(chart.options).then(function(data) {
          chart.data = data;
          var process = _.compose(
            chartDataFactory.format, 
            chartDataFactory.group, 
            chartDataFactory.normalizeSeries
          );
          chart = process(chart);
          processData();
        });                  
      }
      
      function processData() {
        var tmpChart = chartDataFactory.handleSpecialCharts(chart);
        $scope.options.data = tmpChart.data.data;
        $scope.options.labels = tmpChart.data.labels;
        $scope.options.series = tmpChart.data.series;
        $scope.options.legend = tmpChart.options.legend;
        $scope.options.type = tmpChart.options.type;
        
        // setting $scope.options.legend to false doesn't remove the legend like I think it should
        if(!$scope.options.legend) {
          $('#' + $scope.options.id + ' ~ chart-legend').remove();
        }
        
      }

      function setIsLibrary() {
        if(!$scope.$parent.code) {
          $scope.$parent.library = false;
        }
        else {
          $scope.$parent.library = true;
        }        
      }
    },
    templateUrl: 'partials/dashboard-chart.html',
  };

  return directive;
});
