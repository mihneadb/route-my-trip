var mapOptions = null;
var map = null;
var autocomplete = null;
var directionsService = null;
var directionsDisplay = null;

var input = document.getElementById("source");

var coordinates = [];

function computeDistance(route) {
    sum = 0;
    for (var i = 0; i < route.legs.length; i++) {
        sum += route.legs[i].distance.value;
    }
    return sum;
}

function calcRoute() {
    var waypoints = [];
    for (var i = 1; i < coordinates.length - 1; i++) {
        waypoints.push({
            location: coordinates[i],
            stopover: true,
        });
    }

    var request = {
        origin: coordinates[0],
        destination: coordinates[coordinates.length - 1],
        waypoints: waypoints,
        travelMode: google.maps.TravelMode["DRIVING"],
    }

    directionsService.route(request, function(result, status) {
        if (status === "ZERO_RESULTS") {
            alert("Zero results.");
            return;
        }
        directionsDisplay.setDirections(result);

        var distance = computeDistance(result.routes[0]);
        document.getElementById("distance").innerHTML = distance / 1000 + "km";
    });
}

function initialize() {
    mapOptions = {
        center: new google.maps.LatLng(-34.397, 150.644),
        zoom: 8,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
    };
    map = new google.maps.Map(document.getElementById("map-canvas"),
                                  mapOptions);
    autocomplete = new google.maps.places.Autocomplete(input);

    google.maps.event.addListener(map, "click", function(e) {
        var pos = new google.maps.LatLng(e.latLng.lat(), e.latLng.lng());
        var marker = new google.maps.Marker({
            position: pos,
            map: map,
            title: "Clicked here",
        });
        coordinates.push(pos);

        if (coordinates.length >= 2) {
            calcRoute();
        }
    });

    directionsService = new google.maps.DirectionsService();

    var rendererOptions = {
        draggable: false,
        hideRouteList: true,
        polylineOptions: {
            strokeOpacity: 1,
        },
    };
    directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
    directionsDisplay.setMap(map);

}

google.maps.event.addDomListener(window, 'load', initialize);

input.onkeydown = function (e) {
    if (e.which == 13) {
        console.log("enter");
    }
};

