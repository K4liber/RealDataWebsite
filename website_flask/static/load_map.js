function getBasicMap() {
    var map = L.map('map').fitWorld();
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiazRsaWJlciIsImEiOiJja3NtczE4MmUwMW9jMnBucDZkdWYyZ2JzIn0.bRAZ1jLsbV1tY1-zNr9UzA', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1
    }).addTo(map);
    return map
}

function addBasicMarker(map, latLng) {
    let marker = L.marker(latLng).addTo(map);
    marker.bindPopup("" +
        "<div style='margin: 0 auto;'>" +
        "<img style='width: 80px;' src='static/images/avatar.jpg'/>" +
        "<br>Your device" +
        "</div>");
}

function addMarkers(map, data) {
    if (data !== null && data.hasOwnProperty('devices')) {
        for (let i = 0; i < data['devices'].length; i++) {
            let device = data['devices'][i]
            let localization = device['localization']
            let device_id = device['device_id']
            let timestamp = device['timestamp']
            let marker = L.marker([localization['latitude'], localization['longitude']]).addTo(map);
            marker.bindPopup("" +
                "<div style='margin: 0 auto;'>" +
                "<img style='width: 80px;' src='static/images/avatar.jpg'/>" +
                "<br>" + device_id +
                "<br>" + timestamp +
                "</div>");
        }
    }
}

function load_map(data) {
    var map = getBasicMap()
    map.locate({setView: true, maxZoom: 16});

    map.on('locationfound', (e) => {
        if (data !== null && data.hasOwnProperty('middle')) {
            var latlng = [data['middle']['latitude'], data['middle']['longitude']]
        } else {
            var latlng = e.latlng
        }

        map.setView(latlng, 13);
        addBasicMarker(map, e.latlng)
    });
    map.on('locationerror', (error) => {
        alert(error.message)
    });

    addMarkers(map, data)
}

function replaceQueryParam(param, newval, search) {
    var regex = new RegExp("([?;&])" + param + "[^&;]*[;&]?");
    var query = search.replace(regex, "$1").replace(/&$/, '');

    return (query.length > 2 ? query + "&" : "?") + (newval ? param + "=" + newval : '');
}

function onSearchClick() {
    let device_id = document.getElementById("device_id").value;
    console.log(device_id)

    if (device_id !== "") {
        window.location = '/' + replaceQueryParam('device_id', device_id, window.location.search)
    }
}

function loadDeviceIds(device_ids) {
    console.log("device ids: " + device_ids)

    for (let i = 0; i < device_ids.length; i++) {
        var deviceIdElement = document.createElement("option");
        deviceIdElement.textContent = device_ids[i];
        document.getElementById("device_ids").appendChild(deviceIdElement);
    }
}