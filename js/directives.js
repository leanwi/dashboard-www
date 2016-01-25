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
        html2canvas(document.getElementById($scope.options.id + '-container'), {
          onrendered: function(canvas) {
            window.location.href=canvas.toDataURL();
          }
        });
      }
      $scope.exportExcel = function() {
        var form = $('<form method="POST" enctype="application/x-www-form-urlencoded" target="_blank" action="http://localhost:3000/api/v1/util/charttoexcel">');
        form.append($("<input type='hidden' name='chart' value='" + angular.toJson(chart) + "'>"));
        $('body').append(form);
        console.log(form);
        form.submit();
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
        chart.options.limit = $attrs.limit;
      }     
      
      function getData() {
        createChartDefinition();
        chartDataFactory.getData(chart.options, $scope).then(function(data) {
          chart.data = data;
          var process = _.compose(
            chartDataFactory.format, 
            chartDataFactory.group,
            chartDataFactory.limit, 
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