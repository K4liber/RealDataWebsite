function getBasicMap(lat, lon) {
    var mymap = L.map('mapid').setView([lat, lon], 13);

    var tileLayer = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiazRsaWJlciIsImEiOiJja3NtczE4MmUwMW9jMnBucDZkdWYyZ2JzIn0.bRAZ1jLsbV1tY1-zNr9UzA', {
        attribution: 'Map data',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1IjoiazRsaWJlciIsImEiOiJja3NtczE4MmUwMW9jMnBucDZkdWYyZ2JzIn0.bRAZ1jLsbV1tY1-zNr9UzA'
    });
    tileLayer.addTo(mymap);
    return mymap
}

function addBasicMarker(map, lat, lon) {
    var marker = L.marker([lat, lon]).addTo(map);
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
            let marker = L.marker([localization['latitude'], localization['longitude']]).addTo(map);
            marker.bindPopup("" +
                "<div style='margin: 0 auto;'>" +
                "<img style='width: 80px;' src='static/images/avatar.jpg'/>" +
                "<br>" + device_id +
                "</div>");
        }
    }
}

function load_map(data) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
                let mainDeviceLat = position.coords.latitude
                let mainDeviceLon = position.coords.longitude

                if (data !== null && data.hasOwnProperty('middle')) {
                    var lat = data['middle']['latitude']
                    var lon = data['middle']['longitude']
                } else {
                    var lat = mainDeviceLat
                    var lon = mainDeviceLon
                }

                let basicMap = getBasicMap(lat, lon)
                addBasicMarker(basicMap, mainDeviceLat, mainDeviceLon)
                addMarkers(basicMap, data)
            });
    } else {
        alert("Geolocation is not supported by this browser")
    }
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