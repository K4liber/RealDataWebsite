<template>
	<div id="menu">
		<device-details ref="deviceDetails"/>
		<vue-element-loading :active="isLoading" :is-full-screen="false"
							 background-color="rgba(255, 255, 255, .7)" text="Waiting for API response"/>
		DEVICE ID:
		<input list="device_ids" name="device_id" id="device_id" v-model="deviceId">
		<datalist id="device_ids">
			<option v-if="deviceTimestamps !== null"
					v-for="deviceTimestamp in deviceTimestamps" :value="deviceTimestamp.device_id">
				{{ deviceTimestamp.device_id }} ({{ deviceTimestamp.timestampStr }})
			</option>
		</datalist>
		<button @click="show_details" id="show_details" :hidden="deviceId == null">
			Show details
		</button>
		<button @click="get_history" id="get_history" :hidden="deviceId == null">
			{{ this.history ? "Reload history" : "Load history" }}
		</button>
		<button @click="remove_history" id="remove_path" :hidden="polyline == null">
			Hide history
		</button>
		<button @click="draw_device_history" id="show_path"
				:hidden="polyline != null || datetimeFrom == null || datetimeTo == null">
			Show history
		</button>
		<button @click="change_mode" id="change_mode"
				:hidden="datetimeFrom == null">
			{{ this.pathMode ? "Single trace" : "Trace path" }}
		</button>
		<div id="time-range">
			<div id="slider-caption">
				<div id="slider-from"></div>
				<div v-if="pathMode" id="slider-to"></div>
			</div>
			<div id="slider"></div>
		</div>
	</div>
</template>

<script>
import VueElementLoading from 'vue-element-loading'
import {mapGetters, mapMutations} from "vuex";
import axios from "axios";
import {env} from "../../config/env";
import {calculateDistance, getCircleIcon, getMarkerIcon, getMarkerPopUp, getSliderDiv, setZIndex} from "../function";
import {DeviceTimestamp, Localization, MarkerTimestamp} from "../data-class";
import $ from "jquery";
import 'jquery-ui-bundle';
import 'jquery-ui-bundle/jquery-ui.min.css';
import DeviceDetails from "./DeviceDetails";
import dateFormat from "dateformat";

export default {
	name: "Menu",
	components: {
    	VueElementLoading,
		DeviceDetails
  	},
	computed: {
		totalDistanceString: function () {
			return (this.totalDistance <= 1000 ?
				this.totalDistance.toPrecision(6) :
				(this.totalDistance / 1000).toPrecision(6)) +
				(this.totalDistance <= 1000 ? " [m]" : " [km]")
		},
		...mapGetters([
			'map',
			'chosenDeviceId'
		])
	},
    data () {
        return {
			deviceId: null,
			devices: [],
			deviceTimestamps: [],
			sortedMarkersFromHistory: [],
			history: null,
			datetimeFrom: null,
			marker_from: null,
			datetimeTo: null,
			marker_to: null,
			chosenDeviceMarker: null,
			polyline: null,
			totalDistance: 0,
			isLoading: false,
			pathMode: true,
			sliderDiv: getSliderDiv()
        }
    },
	watch: {
		deviceId: {
			deep: true,
			handler(new_device_id, old_device_id) {
				this.clear_history_data()

				if (new_device_id === "") {
					this.setChosenDeviceId(null)
				} else {
					axios.get(env.API_URL + '/get_localization?device_id=' + new_device_id).then(response => {
						let localization = JSON.parse(response.data)
						let latLng = [localization.lat, localization.lon]
						let greenIcon = getMarkerIcon("green")
						this.chosenDeviceMarker = L.marker(latLng, {icon: greenIcon}).addTo(this.map);
						setZIndex(this.map, this.chosenDeviceMarker, 102)
						this.chosenDeviceMarker.bindPopup(
							getMarkerPopUp(
								"Chosen device",
								new_device_id,
								localization.timestamp_str,
							));
						this.map.setView(latLng, 16)
						this.setChosenDeviceId(new_device_id)
					})
				}
			}
		},
		datetimeFrom: {
			deep: true,
			handler(new_value, old_value) {
				this.draw_device_history()
			}
		},
		datetimeTo: {
			deep: true,
			handler(new_value, old_value) {
				this.draw_device_history()
			}
		},
		pathMode: {
			deep: true,
			handler(new_value, old_value) {
				this.reload_slider()
				this.draw_device_history()
			}
		}
	},
	mounted: function() {
		axios.get(env.API_URL + '/get_devices_timestamps').then(response => {
			let response_list = JSON.parse(response.data.replaceAll('\'', ''))

			for (let index = 0; index < response_list.length; index++) {
				let deviceTimestamp = response_list[index]
				this.deviceTimestamps.push(
					new DeviceTimestamp(deviceTimestamp.device_id, deviceTimestamp.timestamp_str)
				)
			}
		})
	},
	methods: {
		clear_history_data() {
			if (this.chosenDeviceMarker) {
				this.chosenDeviceMarker.remove()
			}

			if (this.marker_from) {
				this.marker_from.remove()
			}

			if (this.marker_to) {
				this.marker_to.remove()
			}

			this.clear_path_elements()
			this.history = null
			this.datetimeFrom = null
			this.marker_from = null
			this.datetimeTo = null
			this.marker_to = null
			this.chosenDeviceMarker = null
			this.polyline = null
		},
		change_mode() {
			this.pathMode = this.pathMode === false
		},
		draw_device_history() {
			if (this.chosenDeviceMarker) {
				this.chosenDeviceMarker.remove()
			}

			this.clear_path_elements()

			if (this.pathMode) {
				this.draw_polyline();
			} else {
				this.draw_marker_in_timestamp();
			}
		},
		draw_marker_in_timestamp() {
			if (this.datetimeFrom == null) {
				return
			}

			this.clear_path_elements()
			this.load_markers_from_history()
			this.totalDistance = 0

			for (let markerTimestamp of this.sortedMarkersFromHistory) {
				if (markerTimestamp.timestamp >= this.datetimeFrom) {
					this.marker_from = markerTimestamp.marker;
					this.marker_from.bindPopup(
						getMarkerPopUp(
							"Chosen timestamp",
							this.chosenDeviceId,
							this.datetimeFrom.toLocaleString("pl"),
							dateFormat(this.datetimeFrom, "yyyy-mm-dd-HH-MM-ss")
						));
					this.marker_from.addTo(this.map)
					break;
				}
			}

			let markers = Array.from(this.sortedMarkersFromHistory,(markerFromHistory)=> markerFromHistory.marker);
			markers.push(this.chosenDeviceMarker)
			let group = new L.featureGroup(markers);
			this.map.fitBounds(group.getBounds(), {padding: [50, 50]});
		},
		load_markers_from_history(reload = false) {
			if (this.sortedMarkersFromHistory.length && reload === false) {
				return
			}

			let redIcon = getCircleIcon("red")
			this.sortedMarkersFromHistory = []
			this.totalDistance = 0

			for (let [key, value] of new Map([...this.history.entries()].sort())) {
				if (key >= this.datetimeFrom && key <= this.datetimeTo) {
					if (this.sortedMarkersFromHistory.length === 0) {
						this.sortedMarkersFromHistory.push(
							new MarkerTimestamp(
								key,
								L.marker(new L.LatLng(value.lat, value.lon), {icon: redIcon})
							)
						)
					} else {
						let previous_point =
							this.sortedMarkersFromHistory[this.sortedMarkersFromHistory.length - 1].marker.getLatLng()
						let distance = calculateDistance(value.lat, value.lon, previous_point.lat, previous_point.lng)
						this.totalDistance += distance

						if (distance > 100) {
							this.sortedMarkersFromHistory.push(
								new MarkerTimestamp(
									key,
									L.marker(new L.LatLng(value.lat, value.lon), {icon: redIcon})
								)
							)
						}
					}
				}
				// Push one additional marker in the end
				this.sortedMarkersFromHistory.push(
					new MarkerTimestamp(
						key,
						L.marker(new L.LatLng(value.lat, value.lon), {icon: redIcon})
					)
				)
			}
		},
		draw_polyline() {
			if (this.datetimeFrom == null || this.datetimeTo == null || this.pathMode === false) {
				return
			}

			this.load_markers_from_history()
			let marker_from_found = false
			let marker_to_found = false
			let markersInRange = []
			this.totalDistance = 0

			for (const [index, markerTimestamp] of this.sortedMarkersFromHistory.entries()) {
				if (this.datetimeTo >= markerTimestamp.timestamp && markerTimestamp.timestamp >= this.datetimeFrom) {
					markersInRange.push(markerTimestamp.marker)

					if (index > 1) {
						let current = markerTimestamp.marker.getLatLng()
						let previous = this.sortedMarkersFromHistory[index - 1].marker.getLatLng()
						let distance = calculateDistance(current.lat, current.lng, previous.lat, previous.lng)
						this.totalDistance += distance
					}
				}

				if (marker_from_found === false && markerTimestamp.timestamp >= this.datetimeFrom) {
					this.marker_from = markerTimestamp.marker
					this.marker_from.bindPopup(
					getMarkerPopUp(
						"Start point",
						this.chosenDeviceId,
						this.datetimeFrom.toLocaleString("pl"),
						dateFormat(this.datetimeFrom, "yyyy-mm-dd-HH-MM-ss")
					));
					this.marker_from.addTo(this.map)
					marker_from_found = true
				}

				if (marker_to_found === false && markerTimestamp.timestamp >= this.datetimeTo) {
					this.marker_to = markerTimestamp.marker
					this.marker_to.setIcon(getCircleIcon("green"))
					this.marker_to.bindPopup(
					getMarkerPopUp(
						"End point",
						this.chosenDeviceId,
						this.datetimeTo.toLocaleString("pl"),
						dateFormat(this.datetimeTo, "yyyy-mm-dd-HH-MM-ss")
					));
					this.marker_to.addTo(this.map)
					marker_to_found = true
				}

				if (marker_from_found && marker_to_found) {
					break
				}
			}
			let points = Array.from(markersInRange,(marker) => marker.getLatLng());
			this.polyline = new L.Polyline(points, {
				color: 'red',
				weight: 3,
				opacity: 0.5,
				smoothFactor: 1
			});
			this.polyline.bindPopup(
				this.totalDistanceString
			);
			this.polyline.addTo(this.map);
			markersInRange.push(this.chosenDeviceMarker)
			let group = new L.featureGroup(markersInRange);
			this.map.fitBounds(group.getBounds(), {padding: [50, 50]});
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
		remove_history() {
			this.clear_path_elements()
			this.polyline = null
		},
		show_details() {
			console.log("Menu.vue show_details()")
			if (this.pathMode === false && this.datetimeFrom) {
				this.$refs.deviceDetails.timestamp = this.datetimeFrom;
			} else {
				this.$refs.deviceDetails.timestamp = new Date(Date.now());
			}

			this.$refs.deviceDetails.show();
		},
		load_history(reload = false) {
			this.isLoading = true;

			return new Promise(resolve => {
				if (reload === false && this.history) {
					resolve(true)
				}

				setTimeout(() => {
					axios.get(env.API_URL + '/get_localizations?device_id=' + this.chosenDeviceId).then(response => {
						let localizations = JSON.parse(response.data.replaceAll('\'', ''))
						let dt_from = localizations[0].timestamp_str
						let dt_to = localizations[localizations.length - 1].timestamp_str
						this.datetimeFrom = Date.parse(dt_from)
						this.datetimeTo = Date.parse(dt_to)
						this.history = new Map()

						for (let index = 0; index < localizations.length; index++) {
							let element = localizations[index]
							this.history.set(
								Date.parse(element.timestamp_str),
								new Localization(
									element.lat,
									element.lon,
									element.timestamp_str
								)
							)
						}

						resolve(true)
					})
				}, 10);
				setTimeout(() => resolve(false), 30000);
			});
		},
		async get_history() {
			let loading_succeed = await this.load_history();

			if (loading_succeed === false) {
				this.isLoading = false;
				alert('Loading device history failed')
				return
			}

			this.load_markers_from_history()
			this.reload_slider()
			this.isLoading = false;
		},
		reload_slider() {
			console.log('reload_slider')
			this.datetimeFrom = new Date(this.sortedMarkersFromHistory[0].timestamp)
			this.datetimeTo = new Date(this.sortedMarkersFromHistory[this.sortedMarkersFromHistory.length - 1].timestamp)
			$('#slider-from').html(this.datetimeFrom.toLocaleString("pl"));
			$('#slider-to').html(this.datetimeTo.toLocaleString("pl"));
			let from_val = this.datetimeFrom / 1000;
			let to_val = this.datetimeTo / 1000;
			let mapComponent = this
			$("#slider").remove()
			$('<div>', {
				id: 'slider'
			}).appendTo('#time-range');

			if (this.pathMode) {
				$("#slider").slider({
					range: true,
					min: from_val,
					max: to_val,
					step: 10,
					values: [from_val, to_val],
					slide: function (e, ui) {
						mapComponent.datetimeFrom = new Date(ui.values[0] * 1000);
						$('#slider-from').html(mapComponent.datetimeFrom.toLocaleString("pl"));
						mapComponent.datetimeTo = new Date(ui.values[1] * 1000);
						$('#slider-to').html(mapComponent.datetimeTo.toLocaleString("pl"));
					}
				});
			} else {
				$("#slider").slider({
					range: false,
					min: from_val,
					max: to_val,
					step: 10,
					value: from_val,
					slide: function (e, ui) {
						mapComponent.datetimeFrom = new Date(ui.value * 1000);
						$('#slider-from').html(mapComponent.datetimeFrom.toLocaleString("pl"));
						$('#slider-to').html("");
					}
				});
			}
		},
		...mapMutations([
			'setChosenDeviceId'
		]),
	}
}
</script>

<style scoped>

#menu
{
	min-height: 60px;
	height: auto;
    width: 96vw;
    position: relative;
    z-index: 9999;
    left: 2vw;
    bottom: 99vh;
    background-color: rgba(230, 230, 230, 0.95);
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

#slider-from{
	float:left;
	width:46vw;
	margin: 1vw;
}

#slider-to{
	float:left;
	text-align:right;
	width:46vw;
	margin: 1vw;
}

#slider-caption{
	width: 96vw;
}

</style>
