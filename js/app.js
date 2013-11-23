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

var markerInputDiv = document.getElementById("marker-input-div");
var markerInput = document.getElementById("marker-input");
var markerInputBtn = document.getElementById("marker-input-btn");

var coordinates = [];
var markers = [];
var markerNames = [];
var totalDistance = 0;
var totalDuration = 0;

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
    markerNames = [];
    totalDistance = 0;
    totalDuration = 0;
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

    var durationNode = document.createElement("duration");
    durationNode.innerHTML = duration;

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
    doc += "<route durationunit=\"second\" distanceunit=\"meter\" " +
        "totalduration=\"" + totalDuration + "\" totaldistance=\"" + totalDistance + "\"" +
        " xmlns=\"http://www.mihneadb.net/\" " +
        " xmlns:xs=\"http://www.w3.org/2001/XMLSchema-instance\" " +
        " xs:schemaLocation=\"http://www.mihneadb.net/ schema.xsd\">";

    nodes.forEach(function (node) {
        doc += stringify(node);
    })

    doc += "</route>";

    return vkbeautify.xml(doc.replace(/&nbsp;/g, ""));
}

function makeLegNode(leg, idx) {
    var distance = leg.distance.value; // meters
    var duration = leg.duration.value; // seconds
    var startAddress = leg.start_address; // string
    var endAddress = leg.end_address; // string
    var fromName = markerNames[idx];
    var toName = markerNames[idx + 1];

    totalDistance += distance;
    totalDuration += duration;

    var node = document.createElement("leg");
    node.setAttribute("distance", distance);
    node.setAttribute("duration", duration);
    node.setAttribute("startAddress", startAddress);
    node.setAttribute("endAddress", endAddress);
    node.setAttribute("fromName", fromName);
    node.setAttribute("toName", toName);

    return node;
}

function exportRoute() {
    var nodes = [];
    route.legs.forEach(function (leg) {
        var legNode = makeLegNode(leg, nodes.length);
        leg.steps.forEach(function (step) {
            legNode.appendChild(makeStepNode(step));
        });
        nodes.push(legNode);
    });

    var xml = makeXML(nodes);
    var blob = new Blob([xml], {type: "text/xml;charset=utf-8"});
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

var waitingForName = false;
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
        if (!waitingForName) {
            waitingForName = true;
        } else {
            return;
        }
        tooltip.classList.add("hide");

        // place marker custom title input
        var x = e.pixel.x;
        var y = e.pixel.y;
        markerInputDiv.classList.toggle("hide");
        markerInputDiv.style.top = mapCanvas.offsetTop + y - markerInputDiv.offsetHeight / 2 + "px";
        markerInputDiv.style.left = mapCanvas.offsetLeft + x / 2 + "px";

        markerInput.focus();

        markerInputBtn.onclick = function () {
            markerInputDiv.classList.add("hide");
            waitingForName = false;

            var name = markerInput.value;
            markerNames.push(name);
            markerInput.value = "";

            var pos = new google.maps.LatLng(e.latLng.lat(), e.latLng.lng());
            var marker = new google.maps.Marker({
                position: pos,
                map: map,
                title: name,
            });
            coordinates.push(pos);
            markers.push(marker);

            if (coordinates.length >= 2) {
                calcRoute();
            }
        }
        markerInput.onkeydown = function (e) {
            if (e.which == 13) {
                markerInputBtn.onclick();
            } else if (e.which == 27) {
                markerInputDiv.classList.add("hide");
                waitingForName = false;
                markerInput.value = "";
            }
        };
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

    // position & display tooltip
    var mapCanvas = document.getElementById("map-canvas");
    var tooltip = document.getElementById("tooltip");
    tooltip.classList.toggle("hide");
    tooltip.style.top = mapCanvas.offsetTop + mapCanvas.offsetHeight / 2 - tooltip.offsetHeight / 2 + "px";
    tooltip.style.left = mapCanvas.offsetLeft + mapCanvas.offsetWidth / 2 - tooltip.offsetWidth / 2 + "px";
    tooltip.onclick = function () { tooltip.classList.add("hide"); };
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
