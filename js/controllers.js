myApp.controller("HeaderCtrl", ['$scope', '$location',
  function($scope, $location) {
 
    $scope.isActive = function(route) {
      return route === $location.path();
    }
  }
]);

myApp.controller("FooterCtrl", ['$scope', 'UserAuthFactory', 'siteInfo',
  function($scope, UserAuthFactory, siteInfo) {
    $scope.url = siteInfo.url;
    $scope.name = siteInfo.name;

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
