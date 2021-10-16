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
      'chosenOption',
      'localizationHistory',
      'rangeFrom',
      'rangeTo',
      'sliderFrom',
      'sliderTo'
    ])
  },
  watch: {
    chosenOption: {
      deep: true,
      handler (newValue) {
        if (newValue === 'history') {
          this.draw_polyline(true)
        }
      }
    },
    sliderFrom: {
      deep: true,
      handler (newValue) {
        this.clear_path_elements()
        this.draw_polyline(true)
      }
    },
    sliderTo: {
      deep: true,
      handler (newValue) {
        this.clear_path_elements()
        this.draw_polyline(true)
      }
    },
    localizationHistory: {
      deep: true,
      handler (newValue) {
        this.load_markers_from_history(true)
      }
    },
    chosenDeviceId: {
      deep: true,
      handler (newValue) {
        if (newValue === null || newValue === '') {
          return
        }

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
      let elementIndex = 0

      for (let [key, value] of new Map([...this.localizationHistory.entries()].sort())) {
        if (this.sortedMarkersFromHistory.length === 0) {
          this.sortedMarkersFromHistory.push(
            new MarkerTimestamp(
              key,
              L.marker(new L.LatLng(value.lat, value.lon), {icon: redIcon})
            )
          )
        } else if (elementIndex === (this.localizationHistory.size - 1)) {
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

        elementIndex = elementIndex + 1
      }
    },
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
    draw_polyline (reload = false) {
      if (this.sliderFrom == null || this.sliderTo == null || this.pathMode === false) {
        return
      }

      this.clear_path_elements()
      let markersTimestampsInRange = []
      this.totalDistance = 0

      for (const [index, markerTimestamp] of this.sortedMarkersFromHistory.entries()) {
        let markerDate = new Date(markerTimestamp.timestamp).valueOf()

        if (this.sliderTo.valueOf() >= markerDate && markerDate >= this.sliderFrom.valueOf()) {
          markersTimestampsInRange.push(markerTimestamp)

          if (index > 1) {
            let current = markerTimestamp.marker.getLatLng()
            let previous = this.sortedMarkersFromHistory[index - 1].marker.getLatLng()
            let distance = calculateDistance(current.lat, current.lng, previous.lat, previous.lng)
            this.totalDistance += distance
          }
        }

        if (markerDate > this.sliderTo.valueOf()) {
          break
        }
      }

      if (markersTimestampsInRange.length < 2) {
        return
      }

      if (this.chosenDeviceMarker) {
        this.chosenDeviceMarker.remove()
      }

      let markerTimestampFrom = markersTimestampsInRange[0]
      this.marker_from = markerTimestampFrom.marker
      this.marker_from.bindPopup(
        getMarkerPopUp(
          'Start point',
          this.chosenDeviceId,
          new Date(markerTimestampFrom.timestamp).toLocaleString('pl'),
          dateFormat(markerTimestampFrom.timestamp, 'yyyy-mm-dd-HH-MM-ss')
        )
      )
      this.marker_from.addTo(this.map)
      let markerTimestampTo = markersTimestampsInRange[markersTimestampsInRange.length - 1]
      this.marker_to = markerTimestampTo.marker
      this.marker_to.setIcon(getCircleIcon('green'))
      this.marker_to.bindPopup(
        getMarkerPopUp(
          'End point',
          this.chosenDeviceId,
          new Date(markerTimestampTo.timestamp).toLocaleString('pl'),
          dateFormat(markerTimestampTo.timestamp, 'yyyy-mm-dd-HH-MM-ss')
        )
      )
      this.marker_to.addTo(this.map)
      let points = Array.from(markersTimestampsInRange, (markerTimestamp) => markerTimestamp.marker.getLatLng())
      this.polyline = new L.Polyline(points, {
        color: 'red',
        weight: 3,
        opacity: 0.5,
        smoothFactor: 1
      })
      this.polyline.bindPopup(this.totalDistanceString)
      this.polyline.addTo(this.map)
      let group = L.featureGroup(Array.from(markersTimestampsInRange, (markerTimestamp) => markerTimestamp.marker))
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
