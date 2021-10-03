<template>
  <div id="map"></div>
</template>

<script>
import 'leaflet/dist/leaflet.css'
import L, {Icon, map, tileLayer} from 'leaflet'
import {mapGetters, mapMutations} from 'vuex'
import {getMarkerIcon, getMarkerPopUp, setZIndex, getCircleIcon, calculateDistance} from '../function'
import axios from 'axios'
import {MarkerTimestamp} from '../data-class'
import {env} from '../../config/env'
import dateFormat from 'dateformat'

delete Icon.Default.prototype._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
})

export default {
  name: 'LeafletMap',
  mounted: function () {
    this.setMap(
      map('map', {zoomControl: false}).fitWorld()
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
    ).addTo(this.map)
    this.directToClientLocalization()
  },
  data () {
    return {
      userMarker: null,
      sortedMarkersFromHistory: [],
      pathMode: true,
      chosenDeviceMarker: null,
      polyline: null,
      marker_from: null,
      marker_to: null
    }
  },
  computed: {
    ...mapGetters([
      'map',
      'chosenDeviceId',
      'localizationHistory',
      'rangeFrom',
      'rangeTo'
    ])
  },
  watch: {
    localizationHistory: {
      deep: true,
      handler () {
        if (this.chosenDeviceMarker) {
          this.chosenDeviceMarker.remove()
        }

        this.clear_path_elements()
        this.draw_polyline(true)
      }
    },
    chosenDeviceId: {
      deep: true,
      handler (newValue) {
        if (newValue !== null && this.userMarker != null) {
          this.userMarker.remove()
        }

        if (this.chosenDeviceMarker) {
          this.chosenDeviceMarker.remove()
        }

        this.clear_path_elements()
        axios.get(env.API_URL + '/get_localization?device_id=' + newValue).then(response => {
          let localization = JSON.parse(response.data)
          let latLng = [localization.lat, localization.lon]
          let greenIcon = getMarkerIcon('green')
          this.chosenDeviceMarker = L.marker(latLng, {icon: greenIcon}).addTo(this.map)
          setZIndex(this.map, this.chosenDeviceMarker, 102)
          this.chosenDeviceMarker.bindPopup(
            getMarkerPopUp(
              'Chosen device',
              newValue,
              localization.timestamp_str
            )
          )
          this.map.setView(latLng, 16)
        })
      }
    }
  },
  methods: {
    clear_path_elements () {
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
    directToClientLocalization () {
      this.map.locate({setView: true, maxZoom: 16})
      this.map.on('locationfound', (e) => {
        this.map.setView(e.latlng, 13)
        this.addBasicMarker(this.map, e.latlng)
      })
      this.map.on('locationerror', (error) => {
        alert(error.message)
      })
    },
    addBasicMarker (map, latLng) {
      this.userMarker = L.marker(latLng)
      this.userMarker.addTo(map)
      let today = new Date()
      this.userMarker.bindPopup(
        getMarkerPopUp('Your device', null, today.toLocaleString('pl'))
      )
    },
    load_markers_from_history (reload = false) {
      if (this.rangeFrom === null || this.rangeTo === null || (this.sortedMarkersFromHistory.length && reload === false)) {
        return
      }

      let redIcon = getCircleIcon('red')
      this.sortedMarkersFromHistory = []
      this.totalDistance = 0

      for (let [key, value] of new Map([...this.localizationHistory.entries()].sort())) {
        if (key >= this.rangeFrom && key <= this.rangeTo) {
          if (this.sortedMarkersFromHistory.length === 0) {
            this.sortedMarkersFromHistory.push(
              new MarkerTimestamp(
                key,
                L.marker(new L.LatLng(value.lat, value.lon), {icon: redIcon})
              )
            )
          } else {
            let previousPoint =
              this.sortedMarkersFromHistory[this.sortedMarkersFromHistory.length - 1].marker.getLatLng()
            let distance = calculateDistance(value.lat, value.lon, previousPoint.lat, previousPoint.lng)
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
    draw_polyline (reload = false) {
      console.log('draw_polyline')
      console.log(this.rangeFrom)
      console.log(this.rangeTo)
      console.log(this.pathMode)

      if (this.rangeFrom == null || this.rangeTo == null || this.pathMode === false) {
        return
      }

      console.log('loading markers')
      this.load_markers_from_history(reload)
      let markerFromFound = false
      let markerToFound = false
      let markersInRange = []
      this.totalDistance = 0

      for (const [index, markerTimestamp] of this.sortedMarkersFromHistory.entries()) {
        if (this.rangeTo >= markerTimestamp.timestamp && markerTimestamp.timestamp >= this.rangeFrom) {
          markersInRange.push(markerTimestamp.marker)

          if (index > 1) {
            let current = markerTimestamp.marker.getLatLng()
            let previous = this.sortedMarkersFromHistory[index - 1].marker.getLatLng()
            let distance = calculateDistance(current.lat, current.lng, previous.lat, previous.lng)
            this.totalDistance += distance
          }
        }

        if (markerFromFound === false && markerTimestamp.timestamp >= this.rangeFrom) {
          this.marker_from = markerTimestamp.marker
          this.marker_from.bindPopup(
            getMarkerPopUp(
              'Start point',
              this.chosenDeviceId,
              markerTimestamp.timestamp.toLocaleString('pl'),
              dateFormat(markerTimestamp.timestamp, 'yyyy-mm-dd-HH-MM-ss')
            ))
          this.marker_from.addTo(this.map)
          markerFromFound = true
        }

        if (markerToFound === false && markerTimestamp.timestamp >= this.rangeTo) {
          this.marker_to = markerTimestamp.marker
          this.marker_to.setIcon(getCircleIcon('green'))
          this.marker_to.bindPopup(
            getMarkerPopUp(
              'End point',
              this.chosenDeviceId,
              markerTimestamp.timestamp.toLocaleString('pl'),
              dateFormat(markerTimestamp.timestamp, 'yyyy-mm-dd-HH-MM-ss')
            ))
          this.marker_to.addTo(this.map)
          markerToFound = true
        }

        if (markerFromFound && markerToFound) {
          break
        }
      }
      let points = Array.from(markersInRange, (marker) => marker.getLatLng())
      this.polyline = new L.Polyline(points, {
        color: 'red',
        weight: 3,
        opacity: 0.5,
        smoothFactor: 1
      })
      this.polyline.bindPopup(
        this.totalDistanceString
      )
      this.polyline.addTo(this.map)
      markersInRange.push(this.chosenDeviceMarker)
      let group = L.featureGroup(markersInRange)
      this.map.fitBounds(group.getBounds(), {padding: [50, 50]})
    },
    ...mapMutations([
      'setMap'
    ])
  }
}
</script>

<style scoped>

#map {
  height: 100vh;
  padding: 0;
  margin: 0;
}

</style>
