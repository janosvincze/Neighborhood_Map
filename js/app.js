"use strict";
// global map variable
var map;
// global InfoWindow variable
var infoWindow;
// Array for Map markers
var markers = [];
// Map bound variable to fit map's zoom to window
var bounds;
// To store last active place to unselect and stop animation if focus is changed
var active_place;

// Foursquare client's ID and secret key
var FQ_CLIENT_ID = '135T3OKIMCJSGLQFSPX0MJ0W4EWPVVIH0J00OZGIQ0KCN101';
var FQ_CLIENT_SECRET = '14O3UYKHEXTVI1QVTMY1KFWU3EJM44MT4LA1YVCZREFWWWIJ';

// Defining icons from Google's collection
var iconBase = 'https://maps.google.com/mapfiles/kml/pal2/';
var icons = {
    restaurant: {
        name: 'restaurant',
        icon: iconBase + 'icon40.png'
      },
    coffee: {
        name: 'coffee',
        icon: iconBase + 'icon62.png'
      },
    bar: {
        name: 'bar',
        icon: iconBase + 'icon27.png'
      },
    sport: {
        name: 'sport',
        icon: iconBase + 'icon57.png'
      }
  };

// InfoWindow Content template
// it was originally in the index.html file in a <template>, but it was moved to
// here to be clear it is not for a DOM manipulating, just using as a template
var INFO_WINDOW =
        '<div class="map-infowindow">' +
        '    <div class="map-infowindow-title">' +
        '        <strong>{{title}}</strong>' +
        '   </div>' +
        '    <a href="https://foursquare.com/venue/{{venueID}}"' +
        '        target="_blank">' +
        '    <img class="map-infowindow-fq-logo"' +
        '        src="static/img/foursquare_logo.png"></a>' +
        '    <ul class="map-infowindow-fq">' +
        '        {{tip}}' +
        '    </ul>' +
        '</div>';

// InfoWindow Content Foursquare Tip template
var FQ_TIP =
        '<li class="fq-tip">' +
        '    <div class="tip-author">{{author}}</div>' +
        '    <div class="tip-body">{{body}}</div>' +
        '</li>';

// Create Google Map, after API successfully loaded
function createMap() {

  var myOptions = {
      zoom: 3,
      center: {
          lat: 47.5,
          lng: 19
        },
      mapTypeId: 'roadmap'
    };
  map = new google.maps.Map($('#map')[0], myOptions);
  infoWindow = new google.maps.InfoWindow();
  bounds = new google.maps.LatLngBounds();
  google.maps.event.addDomListener(window, 'resize', function() {
                map.fitBounds(bounds);
    });

  // Activates knockout
  ko.applyBindings(viewModel);
  // Fit map's zoom to the markers
  viewModel.fitZoom();
}

// Alert the user if Google's Map API cannot loaded
function googleError() {
  alert('Something went wrong. Google Map API cannot be loaded!');
}

// Class to represent a single place
var Place = function(title, location, placeID, venueID, id, placeType) {
    var self = this;
    this.id = id;
    this.title = title;
    this.location = location;
    this.lat = location.split(',')[0];
    this.lng = location.split(',')[1];
    // Google's placeID
    this.placeID = placeID;
    // Foursquare's Venue ID
    this.venueID = venueID;
    this.placeType = placeType;
    this.selected = ko.observable(false);
    this.visible = ko.observable(true);
    // the place's marker
    this.marker = null;
    // to store InfoWindow's content
    this.ownInfo = '';

    // filling InfoWindow's content using HTML templates
    var tmpl = INFO_WINDOW;
    var tmpl_row = FQ_TIP;
    var tipList = '';
    tmpl = tmpl.replace('{{title}}', self.title)
               .replace('{{venueID}}', self.venueID);

    // retrieve Foursquare's tips, if venueID is exist
    if (self.venueID) {
      $.ajax({
          dataType: 'jsonp',
          url: 'https://api.foursquare.com/v2/venues/' +
              self.venueID + '/tips' +
              '?client_id=' + FQ_CLIENT_ID +
              '&client_secret=' + FQ_CLIENT_SECRET +
              '&v=20170101',
          success: function(response) {
            // adding the first two tips using HTML template
            // if the place has a rating
            if (response.response.tips.items.length > 0) {
                response.response.tips.items.slice(
                    0, 2).forEach(function(tip) {
                    tipList += tmpl_row.replace(
                        '{{author}}', tip.user.firstName).replace(
                        '{{body}}', tip.text);
                    });
            } else {
                tipList = 'This place is not rated yet.';
            }
            tmpl = tmpl.replace('{{tip}}',
                  tipList);
            self.ownInfo = tmpl;
            },
          // if an error is raised, it will inform the user in the InfoWindow
          error: function() {
             tmpl = tmpl.replace('{{tip}}',
                  'Something went wrong,' +
                  'Communication with Foursquare has been failed!');
             self.ownInfo = tmpl;
          }
        });
    } else {
      tmpl = tmpl.replace('{{tip}}', tipList);
      self.ownInfo = tmpl;
    }

    // setup the place's marker
    this.setMarker = function(marker) {
        self.marker = marker;
        bounds.extend(marker.getPosition());
        // add Click event to the marker
        self.marker.addListener('click', function() {
            self.showInfoWindow();

            infoWindow.addListener('closeclick',function() {
                self.hideInfoWindow();
            });
          });
      }.bind(this);

    // setting the place's visibility, and show/hide its marker
    this.setVisible = function(visible) {
        self.visible(visible);
        self.marker.setVisible(self.visible());
      }.bind(this);

    // show the place's InfoWindow on the map
    this.showInfoWindow = function() {
        // stop the previously selected place's marker animation
        if (active_place) {
            active_place.marker.setAnimation(null);
            active_place.selected(false);
        }
        self.marker.setAnimation(google.maps.Animation.BOUNCE);
        infoWindow.setContent(self.ownInfo);

        infoWindow.addListener('closeclick',function() {
            self.hideInfoWindow();
        });

        // now this is the selected place
        active_place = this;
        infoWindow.open(map, self.marker);
        this.selected(true);

      }.bind(this);

    // hide the place's InfoWindow from the map
    this.hideInfoWindow = function() {
        infoWindow.close();
        self.marker.setAnimation(null);
        self.selected(false);
      }.bind(this);

    // select or not the place
    this.selectPlace = function() {
        if (self.selected()) {
            self.hideInfoWindow();
        } else {
            self.showInfoWindow();
        }
      }.bind(this);
  };

// Overall view model for the screen
var ViewModel = function(places) {
    var self = this;
    // searching text
    self.searchingText = ko.observable('');
    // navigation side is visible or not
    self.navigationVisible = ko.observable(true);
    // initializing places from the parameter
    self.places = ko.observableArray(places.map(function(place) {
        return new Place(place.title, place.location, place.placeID,
                        place.venueID, 0, place.placeType);
      }));

    // selecting visible places to show at the side bar, and on the map
    self.visiblePlaces = ko.computed(function() {
        return self.places().filter(function(place) {
            return place.visible();
          });
      });

    // fit the map's zoom to the markers
    self.fitZoom = function() {
        map.fitBounds(bounds);
      }.bind(this);

    // hide/show the side bar
    self.setMenuVisible = function() {
        self.navigationVisible(!self.navigationVisible());
      }.bind(this);

    // changing the search field
    self.changeSearch = function() {
        if (self.searchingText().length > 0) {
          self.places().forEach(function(place) {
              place.setVisible(place.title.toLowerCase()
                  .search(self.searchingText().toLowerCase()) >=
                  0);
            });
        } else {
          self.places().forEach(function(place) {
              place.setVisible(true);
            });
        }
      };

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
        localStorage.setItem('janos09-places', ko.mapping.toJSON(
            this.places, mapping_options));
      }.bind(this)).extend({
        rateLimit: {
            timeout: 500,
            method: 'notifyWhenChangesStop'
          }
      });
  };

// custom binding to the map
ko.bindingHandlers.map = {
    init: function(element, valueAccessor, allBindingsAccessor,
        viewModel) {
        // set the position
        var position = new google.maps.LatLng(
            allBindingsAccessor().latitude,
            allBindingsAccessor().longitude);
        // creating the marker
        var marker = new google.maps.Marker({
            map: allBindingsAccessor().map,
            position: position,
            title: allBindingsAccessor().title,
            animation: google.maps.Animation.DROP,
            icon: icons[allBindingsAccessor().placeType].icon,
            id: allBindingsAccessor().id
          });

        // set the place's marker
        viewModel.setMarker(marker);

        markers.push(marker);
        viewModel._mapMarker = marker;
      },
    update: function(element, valueAccessor, allBindingsAccessor,
        viewModel) {
        var latlng = new google.maps.LatLng(
            allBindingsAccessor().latitude,
            allBindingsAccessor().longitude);
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

// check local storage for places
var neighborhoodPlaces = ko.utils.parseJson(localStorage.getItem(
    'janos09-places'));

// if there is no saved places in localStorage, assign some
if ((neighborhoodPlaces == undefined) || (neighborhoodPlaces.length < 1)) {
  var neighborhoodPlaces = [{
      'title': 'Beszálló',
      'location': '47.4975069,19.0508149',
      'placeID': 'ChIJa_ni-EHcQUcRZfqefHRuQlY',
      'venueID': '57f39c9fcd107cfe942d55bc',
      'placeType': 'restaurant'
    }, {
      'title': 'Konyha',
      'location': '47.4981425,19.0558193',
      'placeID': 'ChIJVzC6AWrcQUcRallG8lBArlo',
      'venueID': '53bd227b498e5114f56ff20a',
      'placeType': 'restaurant'
    }, {
      'title': 'Szimpla Kert',
      'location': '47.4969627,19.0622091',
      'placeID': 'ChIJ5Q3SoELcQUcRpB0x-9NCdyY',
      'venueID': '4b630e1af964a52020602ae3',
      'placeType': 'restaurant'
    }, {
      'title': 'Bestia',
      'location': '47.5009522,19.0507935',
      'placeID': 'ChIJzXXT02rcQUcRrua6UgQiRmQ',
      'venueID': '55427fd1498ecd5cf6ddf365',
      'placeType': 'restaurant'
    }, {
      'title': 'Coyote Coffee & Deli',
      'location': '47.5058258,19.03719',
      'placeID': 'ChIJR2tBdhncQUcRd-_Kb4MiSvY',
      'venueID': '4c0e7a87512f76b0e8df7a11',
      'placeType': 'coffee'
    }, {
      'title': 'Damniczki Budapest',
      'location': '47.5029682,19.052598',
      'placeID': 'ChIJ_6zzxxTcQUcRWuOG6o6UVrw',
      'venueID': '572f5af4498e935b405bc547',
      'placeType': 'restaurant'
    }, {
      'title': 'Déryné Bisztró',
      'location': '47.4972344,19.0294897',
      'placeID': 'ChIJM1KEgCTcQUcRnr7f9tjnbmo',
      'venueID': '4c5fba3bb36eb713f8049ad2',
      'placeType': 'restaurant'
    }, {
      'title': 'Bazaar Eclectica',
      'location': '47.495559,19.03971',
      'placeID': 'ChIJ09G4VDncQUcRqi8V8PSTlLU',
      'venueID': '5731a9b3498e6b203df9f1a8',
      'placeType': 'restaurant'
    }, {
      'title': 'Oxygen Wellness',
      'location': '47.491152,19.0358403',
      'placeID': 'ChIJs4a1dTrcQUcRhoR7sjnXUIo',
      'venueID': '4d52c5d39ffc236aafc830a7',
      'placeType': 'sport'
    }];
}


// bind a new instance of our view model to the page
var viewModel = new ViewModel(neighborhoodPlaces || []);
