'use strict';

angular.module('sedApp')
  .controller('MapCtrl', function($scope) {
    $scope.title = 'Map';

    initiateMap();

    function initiateMap() {
      var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        osmAttrib = 'Map data © OpenStreetMap contributors',
        osm = L.tileLayer(osmUrl, {minZoom: 6, maxZoom: 18, attribution: osmAttrib}),
        markers = {

          Event: {
            green: L.AwesomeMarkers.icon({
              icon: 'circle',
              markerColor: 'green',
              prefix: 'icon'
            }),
            red: L.AwesomeMarkers.icon({
              icon: 'circle',
              markerColor: 'red',
              prefix: 'icon'
            }),
            black: L.AwesomeMarkers.icon({
              icon: 'circle',
              markerColor: 'black',
              prefix: 'icon'
            }),
            purple: L.AwesomeMarkers.icon({
              icon: 'circle',
              markerColor: 'purple',
              prefix: 'icon'
            })
          }
        };

      function selectIcon(event_class, event_type) {
        switch (event_type) {
          case 4:
            return markers[event_class].purple;
          case 3:
            return markers[event_class].red;
          case 1:
            return markers[event_class].green;
          case 2:
            return markers[event_class].green;
        }
        // Unknown event type?
        return markers[event_class].red;

      }

      function markerPopup(marker_properties) {
        var infoText = marker_properties.name;

        return infoText;
      }

      function createEventsLayer(events) {
        return L.geoJson(events, {
          style: {
            "weight": 1,
            "opacity": 0.3,
          },
          pointToLayer: function(feature, latlng) {
            return L.marker(latlng, {
              icon: selectIcon('Event', feature.properties.event_type),
            });
          },
          onEachFeature: function(feature, layer) {
            var events = document.getElementById('events'),
              featureDiv = document.createElement('div');
            featureDiv.classList.add('event-div');
            $(featureDiv).html(feature.properties.name);
            events.insertBefore(featureDiv, events.firstChild.nextSibling);
            if (feature.properties && feature.properties.name) {
              layer.bindPopup(markerPopup(feature.properties));
            }
          }
        });
      }

      function createVehicleDriveLayer(data) {
        var locations = data.features, polylines = [];
        if (locations.length > 0) {
          var driver = locations[0].properties.driver, i = 0 , linepoints = [];
          while (i < locations.length) {

            if (locations[i].properties.driver != driver) {
              driver = locations[i].properties.driver;
              polylines.push(linepoints);
              linepoints = [];
            }
            linepoints.push([locations[i].geometry.coordinates[1], locations[i].geometry.coordinates[0]]);
            i++;
          }
          polylines.push(linepoints);
        }
        console.log(polylines);
        var colorOptions = ['red', 'blue', 'green', 'yellow'], colorChoice = 0;
        var layer = L.layerGroup(), pline;
        for (j = 0; j < polylines.length; j++) {
          pline = new L.Polyline(polylines[j], {
            color: colorOptions[colorChoice],
            weight: 5,
            smoothFactor: 10

          });
          layer.addLayer(pline);
          colorChoice++;
          if (colorChoice > 3) {
            colorChoice = 0;
          }
        }
        console.log(layer);
        return layer;
      }

      // Facilities GeoJSON Layer
      var events = requestUpdatedJson('/latest_events/86400/'),
        clonedEvents = _.clone(events),
        eventsLayer = createEventsLayer(events),
        vehiclePositions = requestUpdatedJson('/latest_vehicle_locations/600/'),
        clonedVehiclePositions = _.clone(vehiclePositions),
        vehiclePositionsLayer = createVehicleDriveLayer(vehiclePositions);

      setInterval(function() {
        var newEvents = requestUpdatedJson('/latest_events/86400/');
        if (!(_.isEqual(clonedEvents, newEvents))) {
          console.log('events have changed');
          events = newEvents;
          clonedEvents = _.clone(events);
          map.removeLayer(eventsLayer);
          eventsLayer = createEventsLayer(events);
          eventsLayer.addTo(map);
        }
      }, 5000);

      setInterval(function() {
        var newVehiclePositions = requestUpdatedJson('/latest_vehicle_locations/600/');
        if (!(_.isEqual(clonedVehiclePositions, newVehiclePositions))) {
          console.log('vehicle positions have changed');
          vehiclePositions = newVehiclePositions;
          clonedVehiclePositions = _.clone(vehiclePositions);
          map.removeLayer(vehiclePositionsLayer);
          vehiclePositionsLayer = createVehicleDriveLayer(vehiclePositions);
          vehiclePositionsLayer.addTo(map);
        }
      }, 5000);

      var map = L.map('map', {
        center: new L.LatLng(-12, 18),
        zoom: 6,
        minZoom: 1,
        maxZoom: 18,
        layers: [osm, eventsLayer, vehiclePositionsLayer]
      });

      var baseMaps = {
        "Map": osm
      };
      var overlayMaps = {
        "Events": eventsLayer,
        "Vehicle positions": vehiclePositionsLayer,
      };
      map.fitBounds(eventsLayer.getBounds());
      L.control.layers(baseMaps, overlayMaps, {collapsed: false}).addTo(map);
    }

    function requestUpdatedJson(apiUrl) {
      // TODO: Use URL tag to create apiUrl from view name and args
      //var apiUrl;

      // if (argument) {
      //     apiUrl = "/rest/"+api+"/?"+argument+"&format=json";
      // } else {
      //     apiUrl = "/rest/"+api+"/?format=json";
      // }

      var result;
      $.ajax({
        type: 'GET',
        url: apiUrl,
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        async: false,
        success: function(data) {
          result = parseResponseJsonData(data)
        },
        error: function(req, status, error) {
          //var facilities = JSON.parse($("#facilities").attr("data"));
          //result = parseResponseJsonData(facilities);
          alert('Unable to get data: ' + api + ' -  ' + error);
        }
      });
      return result;
    }

// function getDriver(driverId) {
//     return "Driver " + driverId;
// }
    function getBubbleName(f) {
      return "Driver: " + "<b>" + f.driver_phone + "</b>" + "<br>" + f.lat + ", " + f.lon + "<br>" + "Event Code: " + f.event_code + "<br>" + f.event_name + "<br>" + new Date(f.timestamp * 1000);
    }

    function parseResponseJsonData(data) {
      var items = [];
      //var events_array = [];

      $.each(data, function(i, f) {
        var item = {};
        item.properties = {
          name: getBubbleName(f), //getDriver(f.driver),//"Lat: "+f.lat+", Lon: "+f.lon,
          event_type: f.event_type,
          timestamp: f.timestamp,
          driver: f.driver,
        };
        item.geometry = {
          type: "Point",
          coordinates: [f.lon, f.lat]
        };
        item.type = "Feature";
        items.push(item);

        //  events_array.push(f);
        //  console.log(events_array);
      });

      // return the FeatureCollection
      return { type: "FeatureCollection", features: items };
    }
  });
