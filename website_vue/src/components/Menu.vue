<template>
	<div id="menu">
		<vue-element-loading :active="isLoading" :is-full-screen="false"
							 background-color="rgba(255, 255, 255, .7)" text="Waiting for API response"/>
		DEVICE ID:
		<input list="device_ids" name="device_id" id="device_id" v-model="deviceId">
		<datalist id="device_ids">
			<option v-if="deviceIdToTimestamp !== null"
					v-for="(timestamp, device_id) in deviceIdToTimestamp" :value="device_id">
				{{ device_id }} ({{ timestamp }})
			</option>
		</datalist>
		<button @click="pick_timestamp" id="pick_timestamp" :hidden="deviceId == null">
			Load history
		</button>
		<button @click="remove_path" id="remove_path" :hidden="polyline == null">
			Hide path
		</button>
		<button @click="draw_polyline" id="show_path"
				:hidden="polyline != null || datetimeFrom == null || datetimeTo == null">
			Show path
		</button>
		<span :hidden="this.totalDistance === 0">
			Total distance: {{ totalDistanceString }}
		</span>
		<div id="time-range">
			<div id="slider-caption">
				<div id="slider-from"></div>
				<div id="slider-to"></div>
			</div>
			<div class="sliders_step1">
				<div id="slider-range"></div>
			</div>
		</div>
	</div>
</template>

<script>
import VueElementLoading from 'vue-element-loading'
import {mapGetters, mapMutations} from "vuex";
import axios from "axios";
import {env} from "../../config/env";
import {calcCrow, getMarker} from "../function";
import {Localization} from "../data-class";
import $ from "jquery";
import 'jquery-ui-bundle';
import 'jquery-ui-bundle/jquery-ui.min.css';

export default {
	name: "Menu",
	components: {
    	VueElementLoading
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
			deviceIdToTimestamp: null,
			history: null,
			datetimeFrom: null,
			marker_from: null,
			datetimeTo: null,
			marker_to: null,
			polyline: null,
			totalDistance: 0,
			isLoading: false
        }
    },
	watch: {
		deviceId: {
			deep: true,
			handler(new_device_id, old_device_id) {
				if (new_device_id === "") {
					this.setChosenDeviceId(null)
				} else {
					axios.get(env.API_URL + '/get_localization?device_id=' + new_device_id).then(response => {
						let localization = response.data
						let latLng = [localization.lat, localization.lon]
						let marker = L.marker(latLng).addTo(this.map);
						marker.bindPopup(getMarker(new_device_id, localization.timestampStr));
						this.map.setView(latLng, 16)
						this.setChosenDeviceId(new_device_id)
					})
				}
			}
		},
		datetimeFrom: {
			deep: true,
			handler(new_value, old_value) {
				this.draw_polyline()
			}
		},
		datetimeTo: {
			deep: true,
			handler(new_value, old_value) {
				this.draw_polyline()
			}
		}
	},
	mounted: function() {
		axios.get(env.API_URL + '/get_devices_timestamps').then(response => {
			this.deviceIdToTimestamp = JSON.parse(response.data.replaceAll('\'', '"'))
		})
	},
	methods: {
		draw_polyline() {
			if (this.datetimeFrom == null || this.datetimeTo == null) {
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
			this.totalDistance = 0

			for (let [key, value] of this.history) {
				if (key >= this.datetimeFrom && key <= this.datetimeTo) {
					if (points.length === 0) {
						points.push(
							new L.LatLng(value.lat, value.lon)
						)
					} else {
						let previous_point = points[points.length - 1]
						let distance = calcCrow(value.lat, value.lon, previous_point.lat, previous_point.lng)
						this.totalDistance += distance

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
					getMarker("Start point", this.datetimeFrom.toLocaleString("pl")));
				this.marker_from.addTo(this.map)
				this.marker_to = L.marker(points[points.length - 1], {icon: redIcon});
				this.marker_to.bindPopup(
					getMarker("End point", this.datetimeTo.toLocaleString("pl")));
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
		},
		pick_timestamp() {
			this.isLoading = true;

			axios.get(env.API_URL + '/get_localizations?device_id=' + this.chosenDeviceId).then(response => {
				console.log(response.data.replaceAll('\'', ''))
				let localizations = JSON.parse(response.data.replaceAll('\'', ''))
				this.history = new Map();

				for (let index = 0; index < localizations.length; index++) {
					let localization = localizations[index]
					this.history.set(
						Date.parse(localization.timestampStr),
						new Localization(
							localization.lat,
							localization.lon,
							localization.timestampStr
						)
					)
				}

				this.isLoading = false;
				var dt_from = localizations[0].timestampStr
				var dt_to = localizations[localizations.length - 1].timestampStr

				$('#slider-from').html(dt_from);
				$('#slider-to').html(dt_to);
				this.datetimeFrom = Date.parse(dt_from)
				this.datetimeTo = Date.parse(dt_to)
				var min_val = this.datetimeFrom/1000;
				var max_val = this.datetimeTo/1000;
				var mapComponent = this

				$("#slider-range").slider({
					range: true,
					min: min_val,
					max: max_val,
					step: 10,
					values: [min_val, max_val],
					slide: function (e, ui) {
						mapComponent.datetimeFrom = new Date(ui.values[0]*1000);
						$('#slider-from').html(mapComponent.datetimeFrom.toLocaleString("pl"));
						mapComponent.datetimeTo = new Date(ui.values[1]*1000);
						$('#slider-to').html(mapComponent.datetimeTo.toLocaleString("pl"));
					}
				});
			})
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
	min-height: 80px;
    width: 96vw;
    position: relative;
    z-index: 9999;
    left: 2vw;
    bottom: 99vh;
    background-color: rgba(230, 230, 230, 0.9);
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
