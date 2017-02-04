# Neighborhood Map
## Contents
1. [Install](#install)
2. [User's manual](#users-manual)
3. [Developer's manual](#developers-manual)
4. [Sources](#sources)

## Install
### Run Locally
 1. Clone [this repository](https://github.com/janosvincze/neighborhood_map.git)

    ```
    git clone https://github.com/janosvincze/neighborhood_map.git
    ```

 2. Get a [Google's Map API key](https://developers.google.com/maps/documentation/javascript/get-api-key).
  Change my API key to yours in [index.html](https://github.com/janosvincze/neighborhood_map/blob/master/index.html#L64):

    ```
    <script async defer
        src="https://maps.googleapis.com/maps/api/js?key=&[YOUR_API_KEY]callback=createMap"
        onerror="googleError()">
    </script>
    ```

 3. Get a [Foursquare API key](https://foursquare.com/developers/register).
  Cahnge my API key to yours in [app.js](https://github.com/janosvincze/neighborhood_map/blob/master/js/app.js#L7):

    ```
    var fq_clientID = 'YOUR_CLIENT_ID';
    var fq_clientSecret = 'YOUR_CLIENT_SECRET';
    ```

## User's manual
The site should be intuitive to use. You can select a place by clicking to its marker on the map, or clicking its name on the menu (left side). You can also search between places by name using the input field on the side bar.
![alt text][home_page_picture]


## Developer's manual

### Used technology
  * Javascript
  * Knockout.js
  * Google Map API
  * Html
  * CSS

### File structure

HTML file: [index.html](https://github.com/janosvincze/neighborhood_map/blob/master/index.html)

Javascipt file: [app.js](https://github.com/janosvincze/neighborhood_map/blob/master/js/app.js)

CSS file: [main.css](https://github.com/janosvincze/neighborhood_map/blob/master/static/main.css)

### Structure

#### Place class
 To store a place data: title, location, type, Google Place ID, Foursquare ID.
 
 Functions to handle a place:
 * [setMarker](https://github.com/janosvincze/neighborhood_map/blob/master/js/app.js#L94): To add a Google Map marker
 * [setVisible](https://github.com/janosvincze/neighborhood_map/blob/master/js/app.js#L106): To change the place's visibility, and show/hide its marker on the map
 * [setInfoWindow](https://github.com/janosvincze/neighborhood_map/blob/master/js/app.js#L112): To add a Google InfoWindow, and fill it with the place's title and retrieving Foursquare's tips
 * [showInfoWindow](https://github.com/janosvincze/neighborhood_map/blob/master/js/app.js#L164): show the place's InfoWindow on the map
 * [hideInfoWIndow](https://github.com/janosvincze/neighborhood_map/blob/master/js/app.js#L172): hide the place's InfoWindow
 * [selectPlace](https://github.com/janosvincze/neighborhood_map/blob/master/js/app.js#L179): select or not the place
 
#### ViewModel
 Overall view model for the screen
 
 Binded observables:
 * searchingText: To search between the places
 * navigationVisible: To show/hide the places' list
 * places: places array
 * visiblePlaces: computed observable for visible places
 
 Functions:
 * [fitZoom](https://github.com/janosvincze/neighborhood_map/blob/master/js/app.js#L205): To fit the map zoom to the markers
 * [setMenuVisible](https://github.com/janosvincze/neighborhood_map/blob/master/js/app.js#L214): hide/show the side bar by changing its style
 
  ```
     if (self.navigationVisible()) {
          $('.navigation_side').css('display', 'initial');
     } else {
          $('.navigation_side').css('display', 'none');
     }
  ```
 * [changeSearch](https://github.com/janosvincze/neighborhood_map/blob/master/js/app.js#L224): To handle the changing of searchingText
 
#### Custom binding
 Custom binding to the map:
 * In the init callback: create and initialize the place Google's marker and InfoWindow
 * In the update callback: handling the place's marker visibility and show/hide its InfoWindow
 
```javascript
 ko.bindingHandlers.map = {
    init: function(element, valueAccessor, allBindingsAccessor,
        viewModel) {
        // set the position
        var position = new google.maps.LatLng(
            allBindingsAccessor().latitude(),
            allBindingsAccessor().longitude());
        // creating the marker
        var marker = new google.maps.Marker({
            map: allBindingsAccessor().map,
            position: position,
            title: allBindingsAccessor().title(),
            animation: google.maps.Animation.DROP,
            icon: icons[allBindingsAccessor().place_type()].icon,
            id: allBindingsAccessor().id()
          });

        var largeInfowindow = new google.maps.InfoWindow();

        // set the place's marker and InfoWindow
        viewModel.setMarker(marker);
        viewModel.setInfoWindow(largeInfowindow);

        markers.push(marker);
        viewModel._mapMarker = marker;
      },
    update: function(element, valueAccessor, allBindingsAccessor,
        viewModel) {
        var latlng = new google.maps.LatLng(
            allBindingsAccessor().latitude(),
            allBindingsAccessor().longitude());
        viewModel._mapMarker.setPosition(latlng);

        // set the place's visibility
        viewModel.setVisible(viewModel.visible());

        // show or hide the InfoWindow
        if (viewModel.selected()) {
          viewModel.showInfoWindow();
        } else {
          viewModel.hideInfoWindow();
        }
      }
  };
```

#### Creating the map and activating the overall view modell
After Google Map API loaded successfully the [createMap](https://github.com/janosvincze/neighborhood_map/blob/master/js/app.js#L32) function will be called. 
If the API cannot be loaded, the [googleError](https://github.com/janosvincze/neighborhood_map/blob/master/js/app.js#L54) function will be called.
```
    <script async defer
        src="https://maps.googleapis.com/maps/api/js?key=&[YOUR_API_KEY]callback=createMap"
        onerror="googleError()">
    </script>
```

In the [createMap](https://github.com/janosvincze/neighborhood_map/blob/master/js/app.js#L32) function:
 * create the Google Map:
 
   ```
   map = new google.maps.Map($('#map')[0], myOptions);
   ```
 * activate the view model:
 
   ```
   ko.applyBindings(viewModel);
   ```
 
With the [googleError](https://github.com/janosvincze/neighborhood_map/blob/master/js/app.js#L54) function the user will be notified that the Map API loading is failed.

#### Loading, saving the places
For further usage the places' information automatically saved to localStorage by knockout computed obsevable. It will help to implement adding new places function:
 ```
    // using knockout's mapping to select which element of the Place class
    // should be ignoring when its is copied
    var mapping_options = {
        'ignore': ['lat', 'lng', 'selected', 'visible', 'marker',
                   'ownInfoWindow', 'ownInfo', 'hideInfoWindow',
                   'selectPlace', 'setInfoWindow', 'setMarker',
                   'setVisible', 'showInfoWindow']
      };

    ko.computed(function() {
        // store a copy to local storage
        localStorage.setItem('janoss-places', ko.mapping.toJSON(
            this.places, mapping_options));
      }.bind(this)).extend({
        rateLimit: {
            timeout: 500,
            method: 'notifyWhenChangesStop'
          }
      });
 ```

Loading places from localStorage:
 ```
 var neighborhoodPlaces = ko.utils.parseJson(localStorage.getItem(
    'janoss-places'));
 ```

## Sources
  * Udacity Full Stack nanodegree
  * [Foursquare For Developers](https://developer.foursquare.com/)
  * [Knockout.js](http://knockoutjs.com/)
  * [Ryan Niemeyer](https://github.com/rniemeyer) 

[home_page_picture]: https://github.com/janosvincze/neighborhood_map/blob/master/screenshot/map.png "Home page"
