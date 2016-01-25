myApp.controller("HeaderCtrl", ['$scope', '$location',
  function($scope, $location) {
 
    $scope.isActive = function(route) {
      return route === $location.path();
    }
  }
]);

myApp.controller("FooterCtrl", ['$scope', 'UserAuthFactory',
  function($scope, UserAuthFactory) {

    $scope.logout = function () {
      UserAuthFactory.logout();
    }
  }
]);

myApp.controller("HomeCtrl", ['$scope', '$location', 'libraryListFactory',
  function($scope, $location, libraryListFactory) {
    var startDate = $location.search().start ?
      moment($location.search().start, 'MM-DD-YYYY') :
      moment().subtract(1, 'month').startOf('month');
    var endDate = $location.search().end ?
      moment($location.search().end, 'MM-DD-YYYY') :
      moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');
    $scope.datepicker = {};
    $scope.datepicker.options = {
      opens: 'left',
      locale: {
        format: 'MMM DD, YYYY'
      },
      ranges: {
        'Yesterday': [ moment().subtract( 1, 'days' ), moment().subtract( 1, 'days' ) ],
        'Last 7 Days': [ moment().subtract( 6, 'days' ), new Date() ],
        'Last 30 Days': [ moment().subtract( 29, 'days' ), new Date() ],
        'This Month': [ moment().startOf( 'month' ), moment().endOf( 'month' ) ],
        'Last Month': [ moment().subtract( 1, 'month' ).startOf( 'month' ), moment().subtract( 1, 'month' ).endOf( 'month' ) ],
        'This Year': [ moment().startOf( 'year' ), moment().endOf( 'year' ) ],
        'Last Year': [ moment().subtract( 1, 'year' ).startOf( 'year' ), moment().subtract( 1, 'year' ).endOf( 'year' ) ]
      },
    };
    $scope.datepicker.date = {
      startDate: startDate,
      endDate: endDate
    };
    $('#home-sections li[section="' + $scope.section + '"]').addClass('active');
    $scope.code = $location.search().code || null;
    $scope.section = $location.search().section || 'summary';

    if(libraryListFactory.librariesLoaded() === true) {
      $scope.libraries = libraryListFactory.getLibraries();
      $scope.selectedLibrary = _.findWhere($scope.libraries, {code: $scope.code});
    }

    $scope.$on('librariesloaded', function(event, args) {
      $scope.libraries = args;
      $scope.selectedLibrary = _.findWhere($scope.libraries, {code: $scope.code});
    });

    $scope.$watch('datepicker.date', function() {
      updateSearch();
    });

    $scope.selectLibrary = function(l) {
      $scope.code = l.code
      $scope.selectedLibrary = _.findWhere($scope.libraries, {code: $scope.code});
      updateSearch();
    }

    $scope.selectSection = function(event, section) {
      changeSectionIndicator(event.target, section);
    };      
    
    function changeSectionIndicator(e, section) {
      if(section !== $location.search.section) {
        var li = $(e).parent();
        var ul = li.parent();

        $scope.section = section;
        updateSearch();
        
        $('li', ul).removeClass('active');
        li.addClass('active');
      }     
    }

    function updateSearch() {
      $location.search({
        code: $scope.code,
        start: moment($scope.datepicker.date.startDate).format('MM-DD-YYYY'),
        end: moment($scope.datepicker.date.endDate).format('MM-DD-YYYY'),
        section: $scope.section
      });
    }
  }
]);

myApp.controller("CirculationTimeSeriesCtrl", ['$scope', 'chartDataFactory',
  function($scope, chartDataFactory) {
    var initialDate = true;
    var initialCode = true;
    $scope.metrics = [
      {metric: 'ils-checkout:total', name: 'Checkouts'},
      {metric: 'ils-checkin:total', name: 'Checkins'},
      {metric: 'ils-renewal:total', name: 'Renewals'},
      {metric: 'ils-borrowed:total', name: 'Items Borrowed'},
      {metric: 'ils-lent:total', name: 'Items Lent'},
      {metric: 'ils-item-record:total', name: 'New Items'},
      {metric: 'ils-patron-record:total', name: 'New Patrons'},
      {metric: 'pharos:total', name: 'Pharos'},
      {metric: 'wireless:total', name: 'Wireless'},
      {metric: 'overdrive:total', name: 'Overdrive'}
    ];
    $scope.selectedAction = {metric: 'ils-checkout:total', name: 'Checkouts'};
    $scope.options = {};
    $scope.options.id =  'chart-home-comparisons';
    $scope.options.type = "Line";
    $scope.options.legend = false;
    $scope.options.other = {scaleBeginAtZero: true};
    $scope.$watch('selectedAction', init);
    $scope.$watch('$parent.datepicker.date', function(date) {
      if(initialDate) {initialDate = false;}
      else {init();}
    });
    $scope.$watch('$parent.code', function(code) {
      if(initialCode){initialCode = false;}
      else {init();}
    });
        
    function init() {
      var def = {series: []};
      var dates = _.map(new Array(12), function(item, index) {
        return {
          start: moment($scope.$parent.datepicker.date.endDate).subtract(index, 'months').startOf('month').format('MM-DD-YYYY'),
          end: moment($scope.$parent.datepicker.date.endDate).subtract(index, 'months').endOf('month').format('MM-DD-YYYY')
        };
      }).reverse();
      $scope.options.data = [];
      $scope.options.labels = _.map(dates, function(date){return moment(date.start, 'MM-DD-YYYY').format('MMMM YYYY');});

      _.each(dates, function(date, dateIndex) {        
        def.series.push({
          code: $scope.$parent.code,
          start: date.start,
          end: date.end,
          action: $scope.selectedAction.metric
        });
      });

      chartDataFactory.getData(def, $scope).then(function(data) {
        $scope.options.data = [_.map(data, function(response) {return response.data[0];})];
      });
    }
  }
]);

myApp.controller("CirculationSummaryCtrl", ['$scope', 'summaryFactory',
  function($scope, summaryFactory) {
    summaryFactory.watch($scope, init);
    var placeholders = [
      'checkouts', 
      'checkins', 
      'renewals', 
      'borrowed', 
      'loaned', 
      'patrons', 
      'items', 
      'pharos', 
      'wireless', 
      'overdrive',
      'website'
    ];
    
    $scope.$watchGroup(placeholders, function() {
      if(summaryFactory.checkGroup($scope, placeholders)) {
        $scope.totalcirc = $scope.checkouts + $scope.renewals;
        $scope.net = $scope.loaned - $scope.borrowed;
        $scope.locallyowned = ($scope.checkouts - $scope.borrowed) / $scope.checkouts * 100;
      }
      else {
        $scope.totalcirc = null;
        $scope.net = null;
        $scope.locallyowned = null; 
      }
    });
    
    function init() {
      summaryFactory.getAction($scope, 'ils-checkout:total', 'checkouts');
      summaryFactory.getAction($scope, 'ils-checkin:total', 'checkins');
      summaryFactory.getAction($scope, 'ils-renewal:total', 'renewals');
      summaryFactory.getAction($scope, 'ils-borrowed:total', 'borrowed');
      summaryFactory.getAction($scope, 'ils-lent:total', 'loaned');
      summaryFactory.getAction($scope, 'ils-patron-record:total', 'patrons');
      summaryFactory.getAction($scope, 'ils-item-record:total', 'items');   
      summaryFactory.getAction($scope, 'pharos:total', 'pharos');
      summaryFactory.getAction($scope, 'wireless:total', 'wireless');      
      summaryFactory.getAction($scope, 'overdrive:total', 'overdrive');    
      summaryFactory.getAction($scope, 'website-page:total', 'website');       
    }    
  }
]);

myApp.controller("AdminCtrl", ['$scope', '$interval', 'statusFactory',
  function($scope, $interval, statusFactory) {
    $scope.name = "Admin Controller";

    var interval1;
    var interval2;
    var interval1Length = 5000;
    var interval2Length = 30000;
    var activeJobOptions = ['jobs', 'active'];
    var failedJobOptions = ['jobs', 'failed', 100];
    var recentJobOptions = ['jobs', 'recent', 500];

    statusFactory.getJobStatus(activeJobOptions).then(function(data) {$scope.activeJobs = data;});
    statusFactory.getJobStatus(failedJobOptions).then(function(data) {$scope.failedJobs = data;});
    statusFactory.getJobStatus(recentJobOptions).then(function(data) {$scope.recentJobs = data;});

    interval1 = $interval(function() {
      statusFactory.getJobStatus(activeJobOptions).then(function(data) {$scope.activeJobs = data;});
    }, interval1Length);
    interval2 = $interval(function() {
      statusFactory.getJobStatus(failedJobOptions).then(function(data) {$scope.failedJobs = data;});
      statusFactory.getJobStatus(recentJobOptions).then(function(data) {$scope.recentJobs = data;});
    }, interval2Length);

    $scope.$on('$destroy', function() {
      console.log('Done');
      if(interval1) {$interval.cancel(interval1);}
      if(interval2) {$interval.cancel(interval2);}
    });
  }
]);
