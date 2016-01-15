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

myApp.controller("CirculationSummaryCtrl", ['$scope', '$sce', 'summaryFactory',
  function($scope, $sce, summaryFactory) {
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
      'overdrive'
    ];
    
    $scope.$watchGroup(placeholders, function() {
      if(summaryFactory.checkGroup($scope, placeholders)) {
        $scope.totalcirc = $scope.checkouts + $scope.renewals;
        $scope.net = $scope.loaned - $scope.borrowed;
        $scope.locallyowned = ($scope.checkouts - $scope.borrowed) / $scope.checkouts * 100;
        $scope.waiting = false;
      }
      else {
        $scope.totalcirc = null;
        $scope.net = null;
        $scope.locallyowned = null; 
      }
    });
    
    function init() {
      $scope.waiting = true;
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
    }    
  }
]);

myApp.controller("TerminalListCtrl", ['$scope', '$sce', 'chartDataFactory',
  function($scope, $sce, chartDataFactory) {
    init();
    var checkinOpts = {};
    var checkoutOpts = {};
    var renewalOpts = {};
    
    function init() {
      $scope.waiting = true;
      getActions('ils-checkin:statgroup');
    
    }
    
    function getActions(action) {
      var opts = {};
      opts.start = moment($scope.$parent.datepicker.date.startDate).format('MM-DD-YYYY');
      opts.end = moment($scope.$parent.datepicker.date.endDate).format('MM-DD-YYYY');
      opts.code = $scope.$parent.code;
      opts.action = action;
      chartDataFactory.getData(opts);
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
