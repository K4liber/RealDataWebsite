<template>
	<div class="content">
		<div id="menu_holder">
			<div id="menu">
				<vue-element-loading :active="isLoading" :is-full-screen="false"
									 background-color="rgba(255, 255, 255, .7)" text="Waiting for API response"/>
				DEVICE ID:
				<input list="device_ids" name="device_id" id="device_id" v-model="chosenDeviceId">
				<datalist id="device_ids">
					<option v-if="device_id_to_timestamp !== null"
							v-for="(timestamp, device_id) in device_id_to_timestamp" :value="device_id">
						{{ device_id }} ({{ timestamp }})
					</option>
				</datalist>
				<button @click="pick_timestamp" id="pick_timestamp" :disabled="chosenDeviceId == null">
					Pick timestamp
				</button>
				<button @click="remove_path" id="remove_path" :disabled="polyline == null">
					Remove path
				</button>
				<span :hidden="this.total_distance === 0">
					Total distance:
					{{  this.total_distance <= 1000 ?
						Number.parseFloat(this.total_distance).toPrecision(6) :
					    Number.parseFloat(this.total_distance / 1000).toPrecision(6) }}
					{{  this.total_distance <= 1000 ? "[m]" : "[km]" }}
				</span>
				<div id="time-range">
					<p>Time Range: <span class="slider-time"></span> - <span class="slider-time2"></span>
					</p>

					<div class="sliders_step1">
						<div id="slider-range"></div>
					</div>
				</div>
			</div>
		</div>
		<div id="map"></div>
	</div>
</template>
<script>

import "../assets/css/jquery-ui.css";
import "leaflet/dist/leaflet.css";
import { map, tileLayer, Icon } from "leaflet";
import axios from "axios";
import VueElementLoading from 'vue-element-loading'

delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
	iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
	iconUrl: require('leaflet/dist/images/marker-icon.png'),
	shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});
axios.defaults.headers.get['Access-Control-Allow-Origin'] = '*'
import image from "../assets/avatar.jpg"
import {env} from "../../config/env";
import $ from 'jquery';
import 'jquery-ui-bundle';
import 'jquery-ui-bundle/jquery-ui.min.css';

class Localization {
  constructor(lat, lon) {
    this.lat = lat;
    this.lon = lon;
  }
}

function calcCrow(lat1, lon1, lat2, lon2) {
  var R = 6371000; // m
  var dLat = toRad(lat2-lat1);
  var dLon = toRad(lon2-lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
	Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;
  return d;
}

// Converts numeric degrees to radians
function toRad(Value) {
	return Value * Math.PI / 180;
}

export default {
    name: 'Map',
	components: {
    	VueElementLoading
  	},
	watch: {
		chosenDeviceId: {
			deep: true,
			handler(new_device_id, old_device_id) {
				if (new_device_id === "") {
					this.chosenDeviceId = null
				} else {
					axios.get(env.API_URL + '/get_localization?device_id=' + new_device_id).then(response => {
						let localization = response.data
						let latLng = [localization.lat, localization.lon]
						let marker = L.marker(latLng).addTo(this.map);
						marker.bindPopup(this.getMarker(new_device_id, localization.timestampStr));
						this.map.setView(latLng, 16)
						this.chosenDeviceId = new_device_id
					})
				}
			}
		},
		datetime_from: {
			deep: true,
			handler(new_value, old_value) {
				console.log(new_value)
				this.draw_polyline()
			}
		},
		datetime_to: {
			deep: true,
			handler(new_value, old_value) {
				console.log(new_value)
				this.draw_polyline()
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
			device_id_to_timestamp: null,
			history: null,
			datetime_from: null,
			marker_from: null,
			datetime_to: null,
			marker_to: null,
			polyline: null,
			total_distance: 0,
			isLoading: false
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
		draw_polyline() {
			if (this.datetime_from == null || this.datetime_to == null) {
				return
			}

			this.clear_path_elements()
			let redIcon = L.icon({
				iconUrl: '/static/img/marker-icon-red.png',
				shadowUrl: '/static/img/marker-shadow.png',
				iconAnchor:   [13, 40],  // marker icon position
        		popupAnchor:  [0, -36]  // popup position
			})

			let points = []
			this.total_distance = 0

			for (let [key, value] of this.history) {
				if (key >= this.datetime_from && key <= this.datetime_to) {
					if (points.length === 0) {
						points.push(
							new L.LatLng(value.lat, value.lon)
						)
					} else {
						let previous_point = points[points.length - 1]
						let distance = calcCrow(value.lat, value.lon, previous_point.lat, previous_point.lng)
						this.total_distance += distance

						if (distance > 100) {
							points.push(
								new L.LatLng(value.lat, value.lon)
							)
						}
					}
				}
			}

			if (points.length > 1) {
				this.marker_from = L.marker(points[0], {icon: redIcon});
				this.marker_from.bindPopup(
					this.getMarker("Start point", this.datetime_from.toLocaleString("en-US")));
				this.marker_from.addTo(this.map)
				this.marker_to = L.marker(points[points.length - 1], {icon: redIcon});
				this.marker_to.bindPopup(
					this.getMarker("End point", this.datetime_to.toLocaleString("en-US")));
				this.marker_to.addTo(this.map)
			}

			this.polyline = new L.Polyline(points, {
				color: 'red',
				weight: 3,
				opacity: 0.5,
				smoothFactor: 1
			});
			this.polyline.addTo(this.map);
		},
		clear_path_elements() {
			if (this.polyline != null) {
				this.polyline.remove()
			}

			if (this.marker_from != null) {
				this.marker_from.remove()
			}

			if (this.marker_to != null) {
				this.marker_to.remove()
			}
		},
		remove_path() {
			this.clear_path_elements()
			this.polyline = null
			this.datetime_from = null
			this.datetime_to = null
		},
		pick_timestamp() {
			this.isLoading = true;

			axios.get(env.API_URL + '/get_localizations?device_id=' + this.chosenDeviceId).then(response => {
				console.log(response.data.replaceAll('\'', ''))
				let localizations = JSON.parse(response.data.replaceAll('\'', ''))
				this.history = new Map();

				for (let index = 0; index < localizations.length; index++) {
					let localization = localizations[index]
					// Runs 5 times, with values of step 0 through 4.
					this.history.set(
						Date.parse(localization.timestampStr),
						new Localization(
							localization.lat,
							localization.lon
						)
					)
				}

				this.isLoading = false;
				var dt_from = localizations[0].timestampStr
				var dt_to = localizations[localizations.length - 1].timestampStr
				//var dt_to = "2014/11/24 16:37:43";

				$('.slider-time').html(dt_from);
				$('.slider-time2').html(dt_to);
				var min_val = Date.parse(dt_from)/1000;
				var max_val = Date.parse(dt_to)/1000;
				var mapComponent = this

				$("#slider-range").slider({
					range: true,
					min: min_val,
					max: max_val,
					step: 10,
					values: [min_val, max_val],
					slide: function (e, ui) {
						var dt_cur_from = new Date(ui.values[0]*1000); //.format("yyyy-mm-dd hh:ii:ss");
						mapComponent.datetime_from = dt_cur_from
						$('.slider-time').html(mapComponent.formatDT(dt_cur_from));

						var dt_cur_to = new Date(ui.values[1]*1000); //.format("yyyy-mm-dd hh:ii:ss");
						mapComponent.datetime_to = dt_cur_to
						$('.slider-time2').html(mapComponent.formatDT(dt_cur_to));
					}
				});
			})
		},
		zeroPad(num, places) {
			let zero = places - num.toString().length + 1;
			return Array(+(zero > 0 && zero)).join("0") + num;
		},
		formatDT(__dt) {
			let year = __dt.getFullYear();
			let month = this.zeroPad(__dt.getMonth()+1, 2);
			let date = this.zeroPad(__dt.getDate(), 2);
			let hours = this.zeroPad(__dt.getHours(), 2);
			let minutes = this.zeroPad(__dt.getMinutes(), 2);
			let seconds = this.zeroPad(__dt.getSeconds(), 2);
			return year + '-' + month + '-' + date + ' ' + hours + ':' + minutes + ':' + seconds;
		},
		addBasicMarker(map, latLng) {
			let greenIcon = L.icon({
				iconUrl: '/static/img/marker-icon-green.png',
				shadowUrl: '/static/img/marker-shadow.png',
				iconAnchor:   [13, 40],  // marker icon position
        		popupAnchor:  [0, -36]  // popup position
			})
			let marker = L.marker(latLng, {icon: greenIcon}).addTo(map);
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
	min-height: 80px;
    width: 90vw;
    position: relative;
    z-index: 9999;
    left: 5vw;
    top: 10px;
    background-color: #bbbbbb;
    color: #333333;
}

#time-range p {
    font-family:"Arial", sans-serif;
    font-size:14px;
    color:#333;
}
.ui-slider-horizontal {
    height: 8px;
    background: #D7D7D7;
    border: 1px solid #BABABA;
    box-shadow: 0 1px 0 #FFF, 0 1px 0 #CFCFCF inset;
    clear: both;
    margin: 8px 0;
    -webkit-border-radius: 6px;
    -moz-border-radius: 6px;
    -ms-border-radius: 6px;
    -o-border-radius: 6px;
    border-radius: 6px;
}
.ui-slider {
    position: relative;
    text-align: left;
}
.ui-slider-horizontal .ui-slider-range {
    top: -1px;
    height: 100%;
}
.ui-slider .ui-slider-range {
    position: absolute;
    z-index: 1;
    height: 8px;
    font-size: .7em;
    display: block;
    border: 1px solid #5BA8E1;
    box-shadow: 0 1px 0 #AAD6F6 inset;
    -moz-border-radius: 6px;
    -webkit-border-radius: 6px;
    -khtml-border-radius: 6px;
    border-radius: 6px;
    background: #81B8F3;
    background-image: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgi…pZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JhZCkiIC8+PC9zdmc+IA==');
    background-size: 100%;
    background-image: -webkit-gradient(linear, 50% 0, 50% 100%, color-stop(0%, #A0D4F5), color-stop(100%, #81B8F3));
    background-image: -webkit-linear-gradient(top, #A0D4F5, #81B8F3);
    background-image: -moz-linear-gradient(top, #A0D4F5, #81B8F3);
    background-image: -o-linear-gradient(top, #A0D4F5, #81B8F3);
    background-image: linear-gradient(top, #A0D4F5, #81B8F3);
}
.ui-slider .ui-slider-handle {
    border-radius: 50%;
    background: #F9FBFA;
    background-image: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgi…pZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JhZCkiIC8+PC9zdmc+IA==');
    background-size: 100%;
    background-image: -webkit-gradient(linear, 50% 0, 50% 100%, color-stop(0%, #C7CED6), color-stop(100%, #F9FBFA));
    background-image: -webkit-linear-gradient(top, #C7CED6, #F9FBFA);
    background-image: -moz-linear-gradient(top, #C7CED6, #F9FBFA);
    background-image: -o-linear-gradient(top, #C7CED6, #F9FBFA);
    background-image: linear-gradient(top, #C7CED6, #F9FBFA);
    width: 22px;
    height: 22px;
    -webkit-box-shadow: 0 2px 3px -1px rgba(0, 0, 0, 0.6), 0 -1px 0 1px rgba(0, 0, 0, 0.15) inset, 0 1px 0 1px rgba(255, 255, 255, 0.9) inset;
    -moz-box-shadow: 0 2px 3px -1px rgba(0, 0, 0, 0.6), 0 -1px 0 1px rgba(0, 0, 0, 0.15) inset, 0 1px 0 1px rgba(255, 255, 255, 0.9) inset;
    box-shadow: 0 2px 3px -1px rgba(0, 0, 0, 0.6), 0 -1px 0 1px rgba(0, 0, 0, 0.15) inset, 0 1px 0 1px rgba(255, 255, 255, 0.9) inset;
    -webkit-transition: box-shadow .3s;
    -moz-transition: box-shadow .3s;
    -o-transition: box-shadow .3s;
    transition: box-shadow .3s;
}
.ui-slider .ui-slider-handle {
    position: absolute;
    z-index: 2;
    width: 22px;
    height: 22px;
    cursor: default;
    border: none;
    cursor: pointer;
}
.ui-slider .ui-slider-handle:after {
    content:"";
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    top: 50%;
    margin-top: -4px;
    left: 50%;
    margin-left: -4px;
    background: #30A2D2;
    -webkit-box-shadow: 0 1px 1px 1px rgba(22, 73, 163, 0.7) inset, 0 1px 0 0 #FFF;
    -moz-box-shadow: 0 1px 1px 1px rgba(22, 73, 163, 0.7) inset, 0 1px 0 0 white;
    box-shadow: 0 1px 1px 1px rgba(22, 73, 163, 0.7) inset, 0 1px 0 0 #FFF;
}
.ui-slider-horizontal .ui-slider-handle {
    top: -.5em;
    margin-left: -.6em;
}
.ui-slider a:focus {
    outline:none;
}
</style>
