<template>
	<div class="content">
		<div id="menu_holder">
			<div id="menu">
				DEVICE ID:
				<input list="device_ids" name="device_id" id="device_id" v-model="chosenDeviceId">
				<datalist id="device_ids">
					<option v-if="device_id_to_timestamp !== null"
							v-for="(timestamp, device_id) in device_id_to_timestamp" :value="device_id">
						{{ device_id }} ({{ timestamp }})
					</option>
				</datalist>
			</div>
		</div>
		<div id="map"></div>
	</div>
</template>
<script>

import "leaflet/dist/leaflet.css";
import { map, tileLayer, Icon } from "leaflet";
import axios from "axios";

delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
	iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
	iconUrl: require('leaflet/dist/images/marker-icon.png'),
	shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});
axios.defaults.headers.get['Access-Control-Allow-Origin'] = '*'
import image from "../assets/avatar.jpg"
import {env} from "../../config/env";

export default {
    name: 'Map',
	watch: {
		chosenDeviceId: {
			deep: true,
			handler(new_device_id, old_device_id) {
				console.log(env.API_URL)
				axios.get(env.API_URL + '/get_localization?device_id=' + new_device_id).then(response => {
					let localization = response.data
					let latLng = [localization.lat, localization.lon]
					let marker = L.marker(latLng).addTo(this.map);
					marker.bindPopup(this.getMarker(new_device_id, localization.timestampStr));
					this.map.setView(latLng, 16)
				})
			}
		}
	},
    data () {
        return {
			chosenDeviceId: null,
			map: null,
            msg: 'Real Data Website',
			devices: [],
			image: image,
			device_id_to_timestamp: null
        }
    },
	mounted() {
		this.map = map("map").fitWorld();
		tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiazRsaWJlciIsImEiOiJja3NtczE4MmUwMW9jMnBucDZkdWYyZ2JzIn0.bRAZ1jLsbV1tY1-zNr9UzA', {
			attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
			maxZoom: 18,
			id: 'mapbox/streets-v11',
			tileSize: 512,
			zoomOffset: -1
		}).addTo(this.map);
		console.log(env)
		axios.get(env.API_URL + '/get_devices_timestamps').then(response => {
			this.device_id_to_timestamp = JSON.parse(response.data.replaceAll('\'', '"'))
		})
		this.load_map();
	},
	beforeDestroy() {
		this.map.remove();
	},
	methods: {
		addBasicMarker(map, latLng) {
			let marker = L.marker(latLng).addTo(map);
			var today  = new Date();
			marker.bindPopup(this.getMarker("Your device", today.toLocaleString("en-US")));
		},
		getMarker(device_id, timestamp) {
			return "<div style='margin: 0 auto;'>" +
					"<img style='width: 80px;' :src='image'/>" +
					"<br>" + device_id +
					"<br>" + timestamp +
					"</div>"
		},
		addMarkers(map) {
			for (let i = 0; i < this.devices.length; i++) {
				let device = this.devices[i]
				let localization = device['localization']
				let device_id = device['device_id']
				let timestamp = device['timestamp']
				let marker = L.marker([localization['latitude'], localization['longitude']]).addTo(map);
				marker.bindPopup("" +
					"<div style='margin: 0 auto;'>" +
					"<img style='width: 80px;' :src='image'/>" +
					"<br>" + device_id +
					"<br>" + timestamp +
					"</div>");
			}
		},
		load_map() {
			this.map.locate({setView: true, maxZoom: 16});
			this.map.on('locationfound', (e) => {
				this.map.setView(e.latlng, 13);
				this.addBasicMarker(this.map, e.latlng)
			});
			this.map.on('locationerror', (error) => {
				alert(error.message)
			});

			this.addMarkers(this.map)
		}
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
html, body, #content
{
	height: 100vh;
	padding: 0;
    margin: 0;
}

#map
{
    height: 100vh;
}

#menu_holder {
    height: 0;
}

#menu
{
    width: 20%;
    position: relative;
    z-index: 9999;
    left: 70vw;
    top: 25px;
    background-color: #bbbbbb;
    color: #333333;
}
</style>
