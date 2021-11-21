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

    if (this.$route.matched.length > 0) {
      let firstMatched = this.$route.matched[0]

      if (firstMatched.name === 'home') {
        this.directToClientLocalization()
      }
    }
  },
  data () {
    return {
      userMarker: null,
      sortedMarkersFromHistory: [],
      pathMode: true,
      chosenDeviceMarker: null,
      polyline: null,
      marker_from: null,
      marker_to: null,
      getLocalizationInterval: null
    }
  },
  computed: {
    sliderToMilisecond () {
      return this.sliderTo.valueOf()
    },
    sliderFromMilisecond () {
      return this.sliderFrom.valueOf()
    },
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
    localizationHistory: {
      deep: true,
      handler (newValue) {
        if (newValue) {
          this.setIsLoading(true)
          this.load_markers_from_history(true)

          if (this.sortedMarkersFromHistory.length && this.chosenOption === 'history') {
            this.draw_polyline(true)
          }

          this.setIsLoading(false)
        }
      }
    },
    chosenOption: {
      deep: true,
      handler (newValue) {
        this.chosenDeviceMarker = null
        let optionsWithoutLoading = ['calendar', 'home']

        if (!optionsWithoutLoading.includes(newValue) && this.chosenDeviceId) {
          this.setIsLoading(true)
        }

        this.load_markers_from_history(false)

        if (this.sortedMarkersFromHistory.length && newValue === 'history') {
          this.draw_polyline(true)
        } else if (newValue === 'home') {
          this.directToClientLocalization()
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
    chosenDeviceId: {
      deep: true,
      handler (newValue) {
        if (newValue === null || newValue === '') {
          clearInterval(this.getLocalizationInterval)
          this.getLocalizationInterval = null
          return
        }

        this.setIsLoading(true)

        if (this.getLocalizationInterval === null) {
          this.getLocalizationInterval = setInterval(this.showCurrentLocationOfDevice, 2000)
        }
      }
    }
  },
  methods: {
    showCurrentLocationOfDevice () {
      if (this.chosenOption !== 'device') {
        return
      }

      let deviceId = this.chosenDeviceId

      if (deviceId !== null && this.userMarker != null) {
        this.userMarker.remove()
      }

      this.clear_path_elements()
      axios.get(env.API_URL + '/get_localization?device_id=' + deviceId).then(response => {
        this.setIsDeviceIdCorrect(true)
        let localization = JSON.parse(response.data)
        let latLng = [localization.lat, localization.lon]
        let greenIcon = getMarkerIcon('green')
        let devicedMoved = true

        if (this.chosenDeviceMarker) {
          devicedMoved = !this.chosenDeviceMarker.getLatLng().equals(latLng)

          if (devicedMoved) {
            this.chosenDeviceMarker.remove()
            this.chosenDeviceMarker = L.marker(latLng, {icon: greenIcon}).addTo(this.map)
          }
        } else {
          this.chosenDeviceMarker = L.marker(latLng, {icon: greenIcon}).addTo(this.map)
        }

        setZIndex(this.map, this.chosenDeviceMarker, 102)
        this.chosenDeviceMarker.bindPopup(
          getMarkerPopUp(
            'Chosen device',
            deviceId,
            localization.timestamp_str
          )
        )

        if (devicedMoved) {
          this.map.setView(latLng, 16)
        }

        this.setIsLoading(false)
      })
    },
    directToClientLocalization () {
      this.clear_path_elements()

      if (this.chosenDeviceMarker) {
        this.chosenDeviceMarker.remove()
        this.chosenDeviceMarker = null
      }

      this.map.locate({setView: true, maxZoom: 16})
      this.map.on('locationfound', (e) => {
        this.map.setView(e.latlng, 13)
        this.addBasicMarker(this.map, e.latlng)
      })
      this.map.on('locationerror', (error) => {
        alert(error.message)
      })
      this.setIsLoading(false)
    },
    addBasicMarker (map, latLng) {
      this.userMarker = L.marker(latLng)
      this.userMarker.addTo(map)
      let now = new Date()
      this.userMarker.bindPopup(
        getMarkerPopUp('Your device', null, dateFormat(now, 'yyyy/mm/dd HH:MM:ss'))
      )
    },
    load_markers_from_history (reload = false) {
      if (this.chosenDeviceMarker) {
        this.chosenDeviceMarker.remove()
      }

      if (this.userMarker) {
        this.userMarker.remove()
      }

      if (this.sortedMarkersFromHistory.length && reload === false) {
        return
      }

      let redIcon = getCircleIcon('red')
      this.totalDistance = 0
      let tempSortedMarkersFromHistory = []

      for (const [index, value] of this.localizationHistory.entries()) {
        let key = Date.parse(value.timestampStr)

        if (tempSortedMarkersFromHistory.length === 0) {
          tempSortedMarkersFromHistory.push(
            new MarkerTimestamp(
              key,
              L.marker(new L.LatLng(value.lat, value.lon), {icon: redIcon})
            )
          )
        } else {
          let previousPoint =
            tempSortedMarkersFromHistory[tempSortedMarkersFromHistory.length - 1].marker.getLatLng()
          let distance = calculateDistance(value.lat, value.lon, previousPoint.lat, previousPoint.lng)
          this.totalDistance += distance

          if (distance > 10 || index > this.localizationHistory.length - 10) {
            tempSortedMarkersFromHistory.push(
              new MarkerTimestamp(
                key,
                L.marker(new L.LatLng(value.lat, value.lon), {icon: redIcon})
              )
            )
          }
        }
      }

      this.sortedMarkersFromHistory = tempSortedMarkersFromHistory
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
      if (this.chosenOption !== 'history' || this.sliderFrom == null || this.sliderTo == null || this.pathMode === false) {
        return
      }

      this.clear_path_elements()
      let markersTimestampsInRange = []
      this.totalDistance = 0

      for (const [index, markerTimestamp] of this.sortedMarkersFromHistory.entries()) {
        let markerDateStr = dateFormat(new Date(markerTimestamp.timestamp), 'yyyy/mm/dd HH:MM:ss') + ' +0000'
        let markerDate = new Date(markerDateStr).valueOf()

        if (this.sliderToMilisecond >= markerDate && markerDate >= this.sliderFromMilisecond) {
          markersTimestampsInRange.push(markerTimestamp)

          if (index > 1) {
            let current = markerTimestamp.marker.getLatLng()
            let previous = this.sortedMarkersFromHistory[index - 1].marker.getLatLng()
            let distance = calculateDistance(current.lat, current.lng, previous.lat, previous.lng)
            this.totalDistance += distance
          }
        }

        if (markerDate > this.sliderToMilisecond) {
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
          dateFormat(markerTimestampFrom.timestamp, 'yyyy/mm/dd HH:MM:ss'),
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
          new Date(markerTimestampTo.timestamp).toLocaleString(),
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
      'setMap',
      'setIsDeviceIdCorrect',
      'setIsLoading'
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
