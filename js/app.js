var map;
var markers = [];
var defaultIcon;
var selectedIcon;

// Foursquare client's ID and secret key
var fq_clientID = '135T3OKIMCJSGLQFSPX0MJ0W4EWPVVIH0J00OZGIQ0KCN101';
var fq_clientSecret = '14O3UYKHEXTVI1QVTMY1KFWU3EJM44MT4LA1YVCZREFWWWIJ';

// Defining icons from Google's collection
var iconBase = 'https://maps.google.com/mapfiles/kml/pal2/';
var icons = {
    restaurant: {
        name: 'Restaurant',
        icon: iconBase + 'icon40.png'
      },
    coffee: {
        name: 'Coffee',
        icon: iconBase + 'icon62.png'
      },
    bar: {
        name: 'Bar',
        icon: iconBase + 'icon27.png'
      },
    sport: {
        name: 'Sport',
        icon: iconBase + 'icon57.png'
      }
  };

// Create Google Map, after API successfully loaded
function createMap() {

  defaultIcon = makeMarkerIcon('0091ff');
  selectedIcon = makeMarkerIcon('cc91ff');

  var myOptions = {
      zoom: 3,
      center: {
          lat: 47.5,
          lng: 19
        },
      mapTypeId: 'terrain'
    };
  map = new google.maps.Map($('#map')[0], myOptions);

  // Activates knockout
  ko.applyBindings(viewModel);
  // Fit map's zoom to the markers
  viewModel.fitZoom();
}

// Alert the user if Google's Map API cannot loaded
function googleError() {
  alert('Something went wrong. Google Map API cannot be loaded!');
}

// Function to make marker icon with given color
function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
      'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' +
      markerColor +
      '|40|_|%E2%80%A2',
      new google.maps.Size(21, 34),
      new google.maps.Point(0, 0),
      new google.maps.Point(10, 34),
      new google.maps.Size(21, 34));
  return markerImage;
}

// Class to represent a single place
var Place = function(title, location, place_id, venue_id, id, place_type) {
    var self = this;
    self.id = ko.observable(id);
    self.title = ko.observable(title);
    self.location = ko.observable(location);
    self.lat = ko.observable(location.split(',')[0]);
    self.lng = ko.observable(location.split(',')[1]);
    // Google's Place_ID
    self.place_id = ko.observable(place_id);
    // Foursquare's Venue ID
    self.venue_id = ko.observable(venue_id);
    self.place_type = ko.observable(place_type);
    self.selected = ko.observable(false);
    self.visible = ko.observable(true);
    // the place's marker
    self.marker = ko.observable();
    // the place's InfoWindow
    self.ownInfoWindow = ko.observable();
    // to store InfoWindow's content
    self.ownInfo = ko.observable('');

    // setup the place's marker
    this.setMarker = function(marker) {
        self.marker(marker);
        // add Click event to the marker
        self.marker().addListener('click', function() {
            self.ownInfoWindow().setContent(self.ownInfo());
            self.marker().setAnimation(google.maps.Animation.BOUNCE);
            self.ownInfoWindow().open(map, self.marker());
            self.marker().icon = icons[self.place_type()].icon;
          });
      }.bind(this);

    // setting the place's visibility, and show/hide its marker
    this.setVisible = function(visible) {
        self.visible(visible);
        self.marker().setVisible(self.visible());
      }.bind(this);

    // setting the place's InfoWindow
    this.setInfoWindow = function(infoWindow) {
        self.ownInfoWindow(infoWindow);
        // order infoWindow to its marker
        self.ownInfoWindow().marker = self.marker();
        // filling InfoWindow's content using html templates
        var tmpl = document.getElementById('tmp-infowindow').innerHTML;
        var tmpl_row = document.getElementById('tmp-fq-row').innerHTML;
        var tipList = '';
        tmpl = tmpl.replace('{{title}}', self.title());

        // retrieve Foursquare's tips, if venue_id is exist
        if (self.venue_id()) {
          $.ajax({
              dataType: 'jsonp',
              url: 'https://api.foursquare.com/v2/venues/' +
                  self.venue_id() + '/tips' +
                  '?client_id=' + fq_clientID +
                  '&client_secret=' + fq_clientSecret +
                  '&v=20170101',
              success: function(response) {
                  // adding the first two tips using HTML template
                  response.response.tips.items.slice(
                      0, 2).forEach(function(tip) {
                      tipList += tmpl_row.replace(
                          '{{author}}',
                          tip.user.firstName
                      ).replace(
                          '{{body}}', tip
                          .text);
                    });
                  tmpl = tmpl.replace('{{tip}}',
                      tipList);
                  self.ownInfo(tmpl);
                }
            });
        } else {
          tmpl = tmpl.replace('{{tip}}', tipList);
          self.ownInfo(tmpl);
        }

        // add the content to the InfoWindow
        self.ownInfoWindow().setContent(self.ownInfo());

        // add closing event to the InfoWindow
        self.ownInfoWindow().addListener('closeclick', function() {
            self.ownInfoWindow().close();
            self.marker().setAnimation(null);
            self.marker().icon = icons[self.place_type()].icon;
          });
      }.bind(this);

    // show the place's InfoWindow on the map
    this.showInfoWindow = function() {
        self.marker().setAnimation(google.maps.Animation.BOUNCE);
        self.ownInfoWindow().setContent(self.ownInfo());
        self.ownInfoWindow().open(map, self.marker());
        self.marker().icon = selectedIcon;
      }.bind(this);

    // hide the place's InfoWindow on the map
    this.hideInfoWindow = function() {
        self.ownInfoWindow().close();
        self.marker().setAnimation(null);
        self.marker().icon = icons[self.place_type()].icon;
      }.bind(this);

    // select or not the place
    this.selectPlace = function() {
        self.selected(!self.selected());
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
        return new Place(place.title, place.location, place.place_id,
                        place.venue_id, 0, place.place_type);
      }));

    // selecting visible places to show at the side bar, and on the map
    self.visiblePlaces = ko.computed(function() {
        return self.places().filter(function(place) {
            return place.visible();
          });
      });

    // fit the map's zoom to the markers
    self.fitZoom = function() {
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < markers.length; i++) {
          bounds.extend(markers[i].getPosition());
        }
        map.fitBounds(bounds);
      }.bind(this);

    // hide/show the side bar
    self.setMenuVisible = function() {
        self.navigationVisible(!self.navigationVisible());
        if (self.navigationVisible()) {
          $('.navigation_side').css('display', 'initial');
        } else {
          $('.navigation_side').css('display', 'none');
        }
      }.bind(this);

    // changing the search field
    self.changeSearch = function() {
        if (self.searchingText().length > 0) {
          self.places().forEach(function(place) {
              place.setVisible(place.title().toLowerCase()
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
        localStorage.setItem('janoss-places', ko.mapping.toJSON(
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

// check local storage for places
var neighborhoodPlaces = ko.utils.parseJson(localStorage.getItem(
    'janoss-places'));

// if there is no saved places in localStorage, assign some
if ((neighborhoodPlaces == undefined) || (neighborhoodPlaces.length < 1)) {
  var neighborhoodPlaces = [{
      'title': 'Beszálló',
      'location': '47.4975069,19.0508149',
      'place_id': 'ChIJa_ni-EHcQUcRZfqefHRuQlY',
      'venue_id': '57f39c9fcd107cfe942d55bc',
      'place_type': 'restaurant'
    }, {
      'title': 'Konyha',
      'location': '47.4981425,19.0558193',
      'place_id': 'ChIJVzC6AWrcQUcRallG8lBArlo',
      'venue_id': '53bd227b498e5114f56ff20a',
      'place_type': 'restaurant'
    }, {
      'title': 'Szimpla Kert',
      'location': '47.4969627,19.0622091',
      'place_id': 'ChIJ5Q3SoELcQUcRpB0x-9NCdyY',
      'venue_id': '4b630e1af964a52020602ae3',
      'place_type': 'restaurant'
    }, {
      'title': 'Bestia',
      'location': '47.5009522,19.0507935',
      'place_id': 'ChIJzXXT02rcQUcRrua6UgQiRmQ',
      'venue_id': '55427fd1498ecd5cf6ddf365',
      'place_type': 'restaurant'
    }, {
      'title': 'Coyote Coffee & Deli',
      'location': '47.5058258,19.03719',
      'place_id': 'ChIJR2tBdhncQUcRd-_Kb4MiSvY',
      'venue_id': '4c0e7a87512f76b0e8df7a11',
      'place_type': 'coffee'
    }, {
      'title': 'Damniczki Budapest',
      'location': '47.5029682,19.052598',
      'place_id': 'ChIJ_6zzxxTcQUcRWuOG6o6UVrw',
      'venue_id': '572f5af4498e935b405bc547',
      'place_type': 'restaurant'
    }, {
      'title': 'Déryné Bisztró',
      'location': '47.4972344,19.0294897',
      'place_id': 'ChIJM1KEgCTcQUcRnr7f9tjnbmo',
      'venue_id': '4c5fba3bb36eb713f8049ad2',
      'place_type': 'restaurant'
    }, {
      'title': 'Bazaar Eclectica',
      'location': '47.495559,19.03971',
      'place_id': 'ChIJ09G4VDncQUcRqi8V8PSTlLU',
      'venue_id': '5731a9b3498e6b203df9f1a8',
      'place_type': 'restaurant'
    }, {
      'title': 'Oxygen Wellness',
      'location': '47.491152,19.0358403',
      'place_id': 'ChIJs4a1dTrcQUcRhoR7sjnXUIo',
      'venue_id': '4d52c5d39ffc236aafc830a7',
      'place_type': 'sport'
    }];
};


// bind a new instance of our view model to the page
var viewModel = new ViewModel(neighborhoodPlaces || []);
