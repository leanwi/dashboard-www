myApp.directive('chartTypePicker', function() {
  var directive = {
    controller: function($scope, apiUrl) {
      $scope.selectType = function(type) {
        $scope.chart.options.type = type;
        $scope.processData();
      };
      $scope.makeImage = function() {
        console.log($scope);
        html2canvas(document.getElementById($scope.options.id + '-container'), {
          onrendered: function(canvas) {
            window.location.href=canvas.toDataURL();
          }
        });
      }
      $scope.exportExcel = function() {
        var form = $('<form method="POST" enctype="application/x-www-form-urlencoded" target="_blank" action="' + apiUrl + 'util/charttoexcel">');
        form.append($("<input type='hidden' name='chart' value='" + angular.toJson($scope.chart) + "'>"));
        $('body').append(form);
        form.submit();
      }      
    },
    templateUrl: 'partials/dashboard-chart-toolbar.html'
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
      counter += 1;
      $scope.chart = {options: {}};
      $scope.showChart = true;
      $scope.toolbar = $attrs.hasOwnProperty('noToolbar') ? false : true;
      
      // $scope.options contains the options as needed by Chart.js
      $scope.options = {};
      $scope.options.title = $scope.chart.options.title;
      $scope.options.id = 'chart' + counter;
      $scope.options.type = $scope.chart.options.type;
      $scope.options.legend = $scope.chart.options.legend;
      
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
      
      $scope.processData = function() {
        var tmpChart = chartDataFactory.handleSpecialCharts($scope.chart);
        $scope.options.data = tmpChart.data.data;
        $scope.options.labels = tmpChart.data.labels;
        $scope.options.series = tmpChart.data.series;
        $scope.options.legend = tmpChart.options.legend;
        $scope.options.type = tmpChart.options.type;
        
        // setting $scope.options.legend to false doesn't remove the legend like I think it should
        if(!$scope.options.legend) {
          $('#' + $scope.options.id + ' ~ chart-legend').remove();
        }
      };
      
      setIsLibrary();
      getData();      
      
      function createChartDefinition(opts) {
        if(!opts){opts = {};}
        var selectedDateAndCode = {
          code: opts.code || $scope.$parent.code, 
          start: opts.start || moment($scope.$parent.datepicker.date.startDate).format('MM-DD-YYYY'),
          end: opts.end || moment($scope.$parent.datepicker.date.endDate).format('MM-DD-YYYY') 
        };
        var rawSeries = angular.fromJson($attrs.series);
        var seriesDef = chartDataFactory.insertSelectedDateAndCode(rawSeries, selectedDateAndCode);
        $scope.chart.options.series = seriesDef;
        $scope.chart.options.format = $attrs.format;
        $scope.chart.options.title = $attrs.title;
        $scope.chart.options.groups = $attrs.groups;
        $scope.chart.options.type = $attrs.type || 'Bar'
        $scope.chart.options.legend = $attrs.legend || false;
        $scope.chart.options.limit = $attrs.limit;
      }     
      
      function getData() {
        createChartDefinition();
        chartDataFactory.getData($scope.chart.options, $scope).then(function(data) {
          if(data[0].data.length > 0) {
            $scope.nodata = false;
            $scope.chart.data = data;
            var process = _.compose(
              chartDataFactory.format, 
              chartDataFactory.group,
              chartDataFactory.limit, 
              chartDataFactory.normalizeSeries
            );
            $scope.chart = process($scope.chart);
            $scope.processData();
          }
          else {
            $scope.nodata = true;
          }
        });                  
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