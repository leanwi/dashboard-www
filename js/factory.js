/* global Chart */
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
    var actionOptions = {
      start: moment(scope.$parent.datepicker.date.startDate).format('MM-DD-YYYY'),
      end: moment(scope.$parent.datepicker.date.endDate).format('MM-DD-YYYY'),
      code: scope.$parent.code,
      action: action
    };
    chartDataFactory.getData(actionOptions, action).then(function(data) {
      scope[field] = data.data[0] || 0;
      if(data.data[1]) {scope[field + 'Rank'] = '(' + data.data[1] + ')';}
    });
  };
  
  return service;
});
  

myApp.factory('chartDataFactory', function($http, $q, apiUrl, $timeout, $filter) {
  var service = {};
  var _baseUrl = apiUrl + 'actions';
  var _specialCharts = ['Pie', 'Doughnut', 'PolarArea'];

  var constructUrl = function(options, action) {
    var urlArray = [
      _baseUrl,
      action,
      options.start,
      options.end,
      options.code
    ];
    return _.filter(urlArray, function(part) {return part != undefined;}).join('/');
  }

  formatDays = function(a) {
    return _.map(a, function(item) {
      return moment(item, 'd').format('ddd');
    });
  };

  var formatHours = function(a) {
    return _.map(a, function(item) {
      return moment(item, 'H').format('h a');
    });
  };

  var format = function(a, f) {
    if(f === 'day') {
      return formatDays(a);
    }
    else if(f === 'hour') {
      return formatHours(a);
    }
    else {
      return a;
    }
  };
  
  var sortByValues = function(data) {
    var unsortedArray = _.map(data.labels, function(label, index) {
      return [label, data.data[index]];
    });
    var sortedArray = _.sortBy(unsortedArray, function(a) {
      return -a[1];
    });
    return {
      labels: _.map(sortedArray, function(item) {return item[0];}), 
      data: _.map(sortedArray, function(item) {return item[1];})
    };
  };
  
  var limit = function(data, limit) {
    var sortedData = sortByValues(data);
    var limitedData = {
      labels: _.first(sortedData.labels, limit),
      data: _.first(sortedData.data, limit)
    };
    limitedData.labels.push('Other');
    limitedData.data.push(_.reduce(_.rest(sortedData.data, limit), function(memo, num) {
      return memo + num;
    }, 0));
    return limitedData;
  };
  
  var group = function(data, groups) {
    var groupDef = groups.split(',');
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
          value: makeGroup(group, _.max(data.labels, function(label) {return parseInt(label);}))
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
    return {
      labels: _.map(groups, function(group) {return group.label;}),
      data: _.map(groups, function(group) {return group.value;})
    };
    
    function makeGroup(min, max) {
      return _.reduce(data.data, function(memo, num, index) {
        if(!data.labels[index]) {
          return memo;
        }
        var label = parseInt(data.labels[index]);
        if(label >= min && label <= max) {
          return memo + num;
        }
        else {
          return memo;
        }
      }, 0);
    }
  };
  
  var normalizeSeries = function(options, data) {
    var newData = {};
    newData.series = _.pluck(data, 'display');
    newData.labels = _.sortBy(_.unique(_.flatten(_.map(data, function(line){return line.labels;}))));
    newData.data = makeDataArray(newData.series, newData.labels);
    return newData;
    
    function makeDataArray() {
      var tmpHash = {};
      _.each(newData.labels, function(label) {
        _.each(newData.series, function(series) {
          if(!tmpHash[series]) {
            tmpHash[series] = {};
          }
          tmpHash[series][label] = 0;
        });
      });
      
      _.each(data, function(action, actionIndex) {
        _.each(action.labels, function(label, index) {
          tmpHash[action.display][label] = data[actionIndex].data[index];
        });
      });      
      
      return _.map(tmpHash, function(action) {
        return _.toArray(action);
      });
    }
  };

  service.getData = function(options, action) {
    var deferred = $q.defer()
    var url = constructUrl(options, action);
    
    $http({
      method: 'get',
      url: url
    }).success(function(data) {
      data.labels = format(data.labels, options.format);
      deferred.resolve(data);
    }).error(function() {
      deferred.reject('There was an error accessing the api.');  
    });

    return deferred.promise;
  };

  service.processData = function(options, data) {
    options.data = null;
    options.labels = null;
    options.series = null;
    
    var series = false;
    if(data.length > 1) {
      series = true;
      data = normalizeSeries(options, data);
    }
    else {
      data = data[0];
    }
    $timeout(function() {
      options.labels = data.labels;
      if(options.groups) {
        var groupedData = group(data, options.groups);
        options.labels = groupedData.labels;
        options.data = [groupedData.data];
      }
      else if(_.contains(_specialCharts, options.type)) {
        var limitedData;
        if(data.data.length > 5) {
          limitedData = limit(data, 5);
        }
        else {
          limitedData = data;
        }
        
        options.legend = true;
        options.labels = limitedData.labels;
        options.data = limitedData.data;
      }
      else {
        console.log(data);
        $('#' + options.id).siblings('chart-legend').remove();
        options.legend = false;
        if(series) {
          options.data = data.data;
          options.series = data.series;
        }
        else {
          options.data = [data.data];
        }
      }      
    });

    return options;
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
      console.log(this);
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
