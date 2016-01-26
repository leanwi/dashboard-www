At a minimum, you need to create one file in this directory:

1. custom-home-sections.html
1. custom-home.html

You will need to be somewhat familiar with [AngularJS](https://angularjs.org) and [Bootstrap v3](http://getbootstrap.com) (for styling) to edit these files.

```html
<!-- custom-home-sections.html -->

<!-- the second argument to selectSection will match the value of the ng-switch-when attribute in custom-home.html -->
<li role="presentation" section="summary"><a ng-click="selectSection($event, 'summary')">Summary</a></li>
<li role="presentation" section="ils"><a ng-click="selectSection($event, 'ils')">ILS</a></li>
```


```html
<!-- custom-home.html -->
<div ng-switch="section">
  <!-- the value in ng-switch-when must match the second argument of selectSection in the custom-home-sections.html file -->
  <section ng-switch-when="ils">
    <div class="row">
      <div class="col-lg-4 col-sm-12">
        <!-- 
          The series attribute is json formatted array of metric definitions.
          The format attribute will format the labels. Currently, 'hour' and 'day' are available.
          The title attribute sets the title of the chart 
        -->
        <dashboard-chart series='[{"action":"ils-checkout:hour"}]' format="hour" title="Checkouts by hour"></dashboard-chart>
      </div>
      <div class="col-lg-4 col-sm-12">
        <dashboard-chart series='[{"action":"ils-checkout:day"}]' format="day" title="Checkouts by day"></dashboard-chart>
      </div>
      <div class="col-lg-4 col-sm-12">
        <!-- groups allow you to chunk data. the first group listed is <=, the last group is >=, and all the ones in between are includes ranges. -->
        <dashboard-chart series='[{"action":"ils-checkout:age"}]' title="Checkouts by age" groups="5,6-10,11-14,15-18,19-25,26-40,41-65,66"></dashboard-chart>
      </div>
      <div class="col-lg-4 col-sm-12">
        <!-- charts default to the 'Bar' type, but you can specify an alternate (Line, Pie, Table) here. -->
        <dashboard-chart series='[{"action":"ils-checkout:format"}]' title="Checkouts by format" type="Pie"></dashboard-chart>
      </div>
      <div class="col-lg-4 col-sm-12">
        <dashboard-chart series='[{"action":"ils-checkout:act150_loc"}]' title="Checkouts by Act 150 Location" type="Pie"></dashboard-chart>
      </div>
      <div class="col-lg-4 col-sm-12">
        <dashboard-chart series='[{"action":"ils-item-record:day"}]' format="day" title="Item records by day"></dashboard-chart>
      </div>
      <div class="col-lg-4 col-sm-12">
        <dashboard-chart series='[{"action":"ils-patron-record:day"}]' format="day" title="Patron records by day"></dashboard-chart>
      </div>
      <div class="col-lg-4 col-sm-12">
        <dashboard-chart series='[{"action":"ils-item-record:hour"}]' format="hour" title="Item records by hour"></dashboard-chart>
      </div>
      <div class="col-lg-4 col-sm-12">
        <dashboard-chart series='[{"action":"ils-patron-record:hour"}]' format="hour" title="Patron records by hour"></dashboard-chart>
      </div>
    </div>
  </section>
  <section ng-switch-when="summary">
    <div class="row">
      <div class="col-md-12">
        <!-- This widget uses a custom controller -- see js/custom-controllers for this controller's definition -->
        <div class="widget" ng-controller="CirculationTimeSeriesCtrl">
          <div class="panel panel-default">
            <div class="panel-heading">Past 12 Months - {{selectedAction.name}}</div>
            <div class="panel-body">
              <div class="waiting" ng-show="waiting"><i class="fa fa-spinner fa-spin"></i></div>
              <canvas id="{{options.id}}" class="chart-base" chart-options="options.other" chart-legend="{{options.legend}}" chart-type="options.type" chart-data="options.data" chart-labels="options.labels" chart-series="options.series"></canvas>
              <div style="text-align: center;">
                Choose a stat: <select ng-model="selectedAction" ng-options="metric.name for metric in metrics track by metric.metric"></select>
              </div>
            </div>
          </div>
        </div>
        <!-- multiple metric definitions can be defined resulting in additional columns for a table or series for the charts -->
        <dashboard-chart series='[{"action":"ils-checkout:statgroup","name":"Checkouts"},{"action":"ils-checkin:statgroup","name":"Checkins"},{"action":"ils-renewal:statgroup","name":"Renewals"}]' type="Table" title="Activity by Terminal"></dashboard-chart>
      </div>
    </div>
  </section>
</div>
```