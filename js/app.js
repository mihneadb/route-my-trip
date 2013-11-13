var mapOptions = null;
var map = null;
var autocomplete = null;

var input = document.getElementById("source");


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
        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(e.latLng.lat(), e.latLng.lng()),
            map: map,
            title: "Clicked here",
        });
    });

}

google.maps.event.addDomListener(window, 'load', initialize);

input.onkeydown = function (e) {
    if (e.which == 13) {
        console.log("enter");
    }
};

