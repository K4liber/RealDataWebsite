function getBasicMap(position) {
    var mymap = L.map('mapid').setView([position.coords.latitude, position.coords.longitude], 13);

    var tileLayer = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiazRsaWJlciIsImEiOiJja3NtczE4MmUwMW9jMnBucDZkdWYyZ2JzIn0.bRAZ1jLsbV1tY1-zNr9UzA', {
        attribution: 'Map data',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1IjoiazRsaWJlciIsImEiOiJja3NtczE4MmUwMW9jMnBucDZkdWYyZ2JzIn0.bRAZ1jLsbV1tY1-zNr9UzA'
    });
    tileLayer.addTo(mymap);

    var marker = L.marker([position.coords.latitude, position.coords.longitude]).addTo(mymap);
    marker.bindPopup("" +
        "<div style='margin: 0 auto;'>" +
        "<img style='width: 80px;' src='static/images/avatar.jpg'/>" +
        "<br>Your device" +
        "</div>");
    return mymap
}

function addMarkers(map, data) {
    for (let i = 0; i < data['devices'].length; i++) {
        let device = data['devices'][i]
        let localization = device['localization']
        let marker = L.marker([localization['latitude'], localization['longitude']]).addTo(map);
        marker.bindPopup("" +
            "<div style='margin: 0 auto;'>" +
            "<img style='width: 80px;' src='static/images/avatar.jpg'/>" +
            "<br>Jan Bielecki" +
            "</div>");
    }
}

function load_map(data) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
                let basicMap = getBasicMap(position)
                addMarkers(basicMap, data)
            });
    } else {
        x.innerHTML = "Geolocation is not supported by this browser.";
    }
}
