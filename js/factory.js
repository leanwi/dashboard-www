myApp.factory('libraryListFactory', function($rootScope, $http, apiUrl) {
  var service = {};
  var _libraries;
  var allLibraries = {name: 'All Libraries', code: null};

  $http.get(apiUrl + 'libraries').then(function(data) {
    _libraries = [].concat([allLibraries], data.data);
    $rootScope.$broadcast('librariesloaded', _libraries); 
  });

  service.librariesLoaded = function() {
    if(_libraries) {
      return true;
    }
    return false;
  };

  service.getLibraries = function() {
    return _libraries;
  };

  return service;
});

myApp.factory('statusFactory', function($http, $q, apiUrl) {
  var service = {};
  var _baseUrl = apiUrl + 'status';

  var constructUrl = function(options) {
    return [].concat(_baseUrl, options).join('/');
  }

  service.getJobStatus = function(options) {
    var deferred = $q.defer();
    
    $http({
      method: 'get',
      url: constructUrl(options)
    }).success(function(data) {
      deferred.resolve(data);
    }).error(function() {
      deferred.reject('There was an error accessing the api.');  
    });

    return deferred.promise;
  };

  return service;
});

myApp.factory('summaryFactory', function($sce, chartDataFactory) {
  var service = {};
  
  service.watch = function(scope, callback) {
    scope.$watch('$parent.datepicker.date', callback);
    scope.$watch('$parent.code', callback);
  };
  
  service.checkGroup = function(scope, group) {
    var groupReceivedData = true;
    _.each(group, function(m) {if(scope[m] === null) {groupReceivedData = false;}});
    return groupReceivedData;    
  };
  
  service.getAction = function(scope, action, field) {
    scope[field] = null;  
    scope[field + 'Rank'] = null;
    var def = {series: [{
      start: moment(scope.$parent.datepicker.date.startDate).format('MM-DD-YYYY'),
      end: moment(scope.$parent.datepicker.date.endDate).format('MM-DD-YYYY'),
      code: scope.$parent.code,
      action: action
    }]};
    chartDataFactory.getData(def, scope).then(function(data) {
      scope[field] = data[0].data[0] || 0;
      if(data[0].data[1]) {scope[field + 'Rank'] = '(' + data[0].data[1] + ')';}
    });
  };
  
  return service;
});
  

myApp.factory('chartDataFactory', function($http, $q, apiUrl, $filter) {
  var service = {};
  var _baseUrl = apiUrl + 'actions';
  var _specialCharts = ['Pie', 'Doughnut', 'PolarArea'];

  var constructUrl = function(options) {
    var urlArray = [
      _baseUrl,
      options.action,
      options.start,
      options.end,
      options.code
    ];
    return _.filter(urlArray, function(part) {return part != undefined;}).join('/');
  }

  service.format = function(chart) {
    return chart.options.format ? format(chart.options.format) : chart;

    function format(type) {
      var formats = {
        day: function(item) {return moment(item, 'd').format('ddd');},
        hour: function(item) {return moment(item, 'H').format('h a');}
      };
      chart.data.labels = _.map(chart.data.labels, formats[type]);
      return chart;
    }
  };
  
  service.getData = function(dataDef, scope) {
    scope.waiting = true;
    var defer = $q.defer();
    var resultArray = _.map(dataDef.series, function(s){return null;});
    _.each(dataDef.series, handleDef);
    return defer.promise;
    
    function handleDef(def, index) {
      $http({
        method: 'get',
        url: constructUrl(def)
      }).success(function(data) {
        resultArray[index] = data;
        if(haveReceivedAllResponses()) {
          scope.waiting = false;
          defer.resolve(resultArray);
        }
      }).error(function() {
        defer.reject('There was an error accessing the api.');  
      });      
    }
    
    function haveReceivedAllResponses() {
      var retVal = true
      //Received all responses if resultArray doesn't have any null items
      _.each(resultArray, function(r){if (_.isNull(r)){retVal = false;}});
      return retVal;
    }
  }; 
  
  service.group = function(chart) {
    return chart.options.groups ? makeGroups() : chart;
    
    function makeGroups() {
      var groupDef = chart.options.groups.split(',');
      var groups = _.map(groupDef, function(group, index) {
        if(index === 0) {
          return {
            label: '< ' + group,
            value: makeGroup(0, parseInt(group)) 
          };
        }
        else if(index === groupDef.length - 1) {
          return {
            label: group + ' >',
            value: makeGroup(group, _.max(chart.data.labels, function(label) {return parseInt(label);}))
          }
        }
        else {
          var limits = group.split('-');
          return {
            label: limits[0] + ' - ' + limits[1],
            value: makeGroup(limits[0], limits[1])
          }
        }
      });
      chart.data.labels = _.map(groups, function(group) {return group.label;});
      chart.data.data = [_.map(groups, function(group) {return group.value;})];
      return chart;
    }

    function makeGroup(min, max) {
      return _.reduce(chart.data.data[0], function(memo, num, index) {
        if(!chart.data.labels[index]) {
          return memo;
        }
        var label = parseInt(chart.data.labels[index]);
        if(label >= min && label <= max) {
          return memo + num;
        }
        else {
          return memo;
        }
      }, 0);
    }
  };
  
  service.handleSpecialCharts = function(chart) {
    var limitValue = 5;
    return isSpecialChart() ? handleSpecialChart() : chart;
    
    function handleSpecialChart() {
      var tmpChart = angular.merge({}, chart);
      tmpChart.data = limit(tmpChart.data);
      tmpChart.options.legend = true;
      return tmpChart;
    }
    
    function isSpecialChart() {
      if(_.contains(_specialCharts, chart.options.type)) {
        return true;
      }
      return false;
    }
    
    function limit(data) {
      if(data.data[0].length > limitValue) {
        var sortedData = sort(data);
        data.data = _.first(sortedData.data, limitValue);
        data.labels = _.first(sortedData.labels, limitValue);
        data.labels.push('Other');
        data.data.push(_.reduce(_.rest(sortedData.data, limitValue), function(memo, num){return memo + num;}, 0));
      }
      else {
        data.data = data.data[0];
      }
      return data;
    }
    
    function sort(data) {
      var unsortedArray = _.map(data.labels, function(label, index) {return [label, data.data[0][index]];});
      var sortedArray = _.sortBy(unsortedArray, function(a) {return -a[1];});
      data.labels = _.map(sortedArray, function(item) {return item[0];});
      data.data = _.map(sortedArray, function(item) {return item[1];});
      return data;
    }
  };
  
  service.insertSelectedDateAndCode = function(defs, selected) {
    return _.map(defs, function(def) {
      if(!def.code) {def.code = selected.code;}
      if(!def.start) {def.start = selected.start;}
      if(!def.end) {def.end = selected.end;}
      return def;
    });
  };
  
  service.normalizeSeries = function(chart) {
    var newData = {};
    var actions = _.pluck(chart.data, 'url');
    newData.series = _.pluck(chart.options.series, 'name');
    newData.labels = _.sortBy(_.unique(_.flatten(_.map(chart.data, function(line){return line.labels;}))));
    newData.data = makeDataArray(newData.series, newData.labels);
    chart.data = newData;
    return chart;
    
    function makeDataArray() {
      var tmpHash = {};
      _.each(newData.labels, function(label) {
        _.each(actions, function(action) {
          if(!tmpHash[action]) {
            tmpHash[action] = {};
          }
          tmpHash[action][label] = 0;
        });
      });
      
      _.each(chart.data, function(action, actionIndex) {
        _.each(action.labels, function(label, index) {
          tmpHash[action.url][label] = chart.data[actionIndex].data[index];
        });
      });      
      
      return _.map(tmpHash, function(action) {
        return _.toArray(action);
      });
    }
  };  

  Chart.Type.extend({
    name: 'Table',

    defaults: {},
    initialize: function(data) {
      $(this.chart.canvas).toggle();
      this.table = {};
      this.table.container = $('#' + this.chart.canvas.id + '-table');
      this.table.container.toggle();
      this.draw(data);
    },
    draw: function(data) {
      var html = '<div class=\'table-container\'><table>';
      if(data.datasets.length > 1) {
        html += '<thead><tr><td></td>'
        _.each(data.datasets, function(set) {
          html += '<th>' + set.label + '</th>';
        });
        html += '</tr></thead>';
      }
      _.each(data.labels, function(label, index) {
        html += '<tr><th>' + label + '</th>';
        _.each(data.datasets, function(set) {
          html += '<td>' + $filter('number')(set.data[index]) + '</td>';
        });
        html += '</tr>';
      }); 

      html += '</table></div>';
      this.table.container.html(html);
      
    },
    destroy: function() {
      this.table.container.html(''); 
      this.table.container.toggle();
      $(this.chart.canvas).toggle();
    }
  });

  return service;
});