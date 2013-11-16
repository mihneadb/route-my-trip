var mapOptions = null;
var map = null;
var autocomplete = null;
var directionsService = null;
var directionsDisplay = null;
var route = null;

var clearBtn = document.getElementById("clear");
var exportBtn = document.getElementById("export");
var distanceText = document.getElementById("distance");

var input = document.getElementById("center");
var centerBtn = document.getElementById("center-btn");

var coordinates = [];
var markers = [];

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
        hideAllMarkers();
        directionsDisplay.setMap(map);
        directionsDisplay.setDirections(result);

        route = result.routes[0];

        var distance = computeDistance(result.routes[0]);
        distanceText.innerHTML = distance / 1000 + " km";

        if (exportBtn.classList.contains("hide")) {
            exportBtn.classList.toggle("hide");
        }
    });
}

function stripTags(text) {
    text = text.replace(/\<div/g, ". <p");
    text = text.replace(/\<\/div/g, ". </p");
    var div = document.createElement("div");
    div.innerHTML = text;
    var stripped = div.textContent || div.innerText || "";
    return stripped;
}

function hideAllMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
}

function clear() {
    hideAllMarkers();
    markers = [];
    coordinates = [];
    directionsDisplay.setMap(null);
    distanceText.innerHTML = "";
    if (!exportBtn.classList.contains("hide")) {
        exportBtn.classList.toggle("hide");
    }
}

function makeStepNode(step) {
    var distance = step.distance.value; // meters
    var duration = step.duration.value; // seconds
    var instructions = stripTags(step.instructions); // string

    var node = document.createElement("step");

    var distanceNode = document.createElement("distance");
    distanceNode.innerHTML = distance;
    distanceNode.setAttribute("unit", "meter");

    var durationNode = document.createElement("duration");
    durationNode.innerHTML = duration;
    durationNode.setAttribute("unit", "second");

    var instructionsNode = document.createElement("instructions");
    instructionsNode.innerHTML = instructions;

    node.appendChild(instructionsNode);
    node.appendChild(durationNode);
    node.appendChild(distanceNode);

    return node;
}

function stringify(node) {
    var div = document.createElement("div");
    div.appendChild(node);
    return div.innerHTML;
}

function makeXML(nodes) {
    var doc = "<?xml version=\"1.0\" ?>";
    doc += "<route>";

    nodes.forEach(function (node) {
        doc += stringify(node);
    })

    doc += "</route>";

    return vkbeautify.xml(doc);
}

function exportRoute() {
    var nodes = [];
    route.legs.forEach(function (leg) {
        leg.steps.forEach(function (step) {
            nodes.push(makeStepNode(step));
        });
    });

    var xml = makeXML(nodes);
    var blob = new Blob([xml], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "route.xml");
}

function centerMap(address) {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({
        "address": address
    }, function(results, status) {
        var loc = results[0].geometry.location;
        map.setCenter(loc);
    });
}

function initialize() {
    mapOptions = {
        center: new google.maps.LatLng(44.434721, 26.055064),
        zoom: 15,
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
        markers.push(marker);

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
        centerMap(input.value);
    }
};
centerBtn.onclick = function() {
    centerMap(input.value);
}

clearBtn.onclick = clear;
exportBtn.onclick = exportRoute;
