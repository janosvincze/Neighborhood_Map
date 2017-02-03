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
  Change my API key to yours one in [index.html](https://github.com/janosvincze/neighborhood_map/blob/master/index.html#L64):

    ```
    <script async defer
        src="https://maps.googleapis.com/maps/api/js?key=&[YOUR_API_KEY]callback=createMap"
        onerror="googleError()">
    </script>
    ```

 3. Get a [Foursquare API key](https://foursquare.com/developers/register).
  Cahnge my API key to yours one in [app.js](https://github.com/janosvincze/neighborhood_map/blob/master/js/app.js#L7):

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
 * setMarker: To add a Google Map marker
 * setVisible: To change the place's visibility, and show/hide its marker on the map
 * setInfoWindow: To add a Google InfoWindow, and fill it with the place's title and retrieving Foursquare's tips
 * showInfoWindow: show the place's InfoWindow on the map
 * hideInfoWIndow: hide the place's InfoWindow
 * selectPlace: select or not the place
 
#### ViewModel
 Overall view model for the screen
 
 Binded observables:
 * searchingText: To search between the places
 * navigationVisible: To show/hide the places' list
 * places: places array
 * visiblePlaces: computed observable for visible places
 
 Functions:
 * fitZoom: To fit the map zoom to the markers
 * setMenuVisible: hide/show the side bar
 * changeSearch: To handle the changing of searchingText
 
#### Custom binding



## Sources
  * Udacity Full Stack nanodegree
  * [Foursquare For Developers](https://developer.foursquare.com/)
  * [Knockout.js](http://knockoutjs.com/)

[home_page_picture]: https://github.com/janosvincze/neighborhood_map/blob/master/screenshot/map.png "Home page"
