# Library Statistical Dashboard - Frontend

This AngularJS-based frontend is meant to work the [Library Statistical Dashboard - Backend/Api](https://github.com/glfalkenberg/dashboard-api). Please install that first.

Example sites:
- http://dashboard.iflsweb.org
- http://dashboard.wvls.org

## Installation
1. Install [bower](http://bower.io) and its prerequisites.
2. Clone this repository to a directory on your server 

    ```bash
    $ git clone https://github.com/glfalkenberg/dashboard-www.git /opt/dashboard/www
    ```

3. Enter that directory and install the necessary libraries

    ```bash
    $ cd /opt/dashboard/www
    $ bower install
    ```
    
4. Create main application configuration file

    ```bash
    $ vi js/custom-app.js
    ```
    
  Add the following information, customizing it as necessary
  
    ```javascript
    // Path to your data api
    myApp.constant('apiUrl', 'http://api.dashboard.yourlibrary.org/api/v1/');
    // Your library's information, which is used in the footer
    myApp.constant('siteInfo', {name: 'Your Library', url: 'http://www.yourlibrary.org'});
    ```
    
5. Add charts to your site by creating and editing js/custom-controllers.js, partials/custom-home.html, partials/custom-home-sections.html, and css/custom/*
More information about editing those files is found in their directories' README files.

6. Point the web server of your choice to the directory created above.

## Upgrades
Upgrade using a pull request in the website's root directory (for example -- /opt/dashboard/www)

```bash
$ git pull
```

As long as you didn't edit any files that aren't prefixed by `custom-`, there should be no danger of overwriting your local changes.

## Customization
You can customize the charts by editing files that begin with `custom-` in the `js` and `partials` directories. More information is available in those directories` README files.