<template>
	<div id="map"></div>
</template>

<script>
import "leaflet/dist/leaflet.css";
import {Icon, map, tileLayer} from "leaflet";
import {mapGetters, mapMutations} from "vuex";
import {getMarkerPopUp} from "../function";

delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
	iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
	iconUrl: require('leaflet/dist/images/marker-icon.png'),
	shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default {
	name: "LeafletMap",
	mounted: function() {
		this.setMap(
			map("map", { zoomControl: false }).fitWorld()
		)
		tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}' +
			'?access_token=pk.eyJ1IjoiazRsaWJlciIsImEiOiJja3NtczE4MmUwMW9jMnBucDZkdWYyZ2JzIn0.bRAZ1jLsbV1tY1-zNr9UzA',
			{
				attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
				maxZoom: 18,
				id: 'mapbox/streets-v11',
				tileSize: 512,
				zoomOffset: -1
			}
		).addTo(this.map);
		this.directToClientLocalization();
	},
	computed: {
		...mapGetters([
			'map'
		])
	},
	methods: {
		directToClientLocalization() {
			this.map.locate({setView: true, maxZoom: 16});
			this.map.on('locationfound', (e) => {
				this.map.setView(e.latlng, 13);
				this.addBasicMarker(this.map, e.latlng)
			});
			this.map.on('locationerror', (error) => {
				alert(error.message)
			});
		},
		addBasicMarker(map, latLng) {
			let greenIcon = L.icon({
				iconUrl: '/static/img/marker-icon-green.png',
				shadowUrl: '/static/img/marker-shadow.png',
				iconAnchor:   [13, 40],  // marker icon position
        		popupAnchor:  [0, -36]  // popup position
			})
			let marker = L.marker(latLng, {icon: greenIcon}).addTo(map);
			let today  = new Date();
			marker.bindPopup(getMarkerPopUp("Your device", null, today.toLocaleString("pl")));
		},
		...mapMutations([
			'setMap'
		]),
	}
}
</script>

<style scoped>

#map
{
    height: 100vh;
}

</style>
