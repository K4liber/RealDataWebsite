<template>
  <div id="menu">
    <vue-element-loading :active="isLoading" :is-full-screen="false"
                         background-color="rgba(255, 255, 255, .7)" text="Waiting for API response"/>
    <select-device v-if="chosenOption === 'device'"/>
    <div v-if="chosenOption !== 'device'">
      <input list="device_ids" name="device_id" id="device_id" v-model="deviceId" placeholder="Select device ID">
      <datalist id="device_ids">
        <option v-if="devicesTimestampsRange !== null" :key="deviceId"
                v-for="[deviceId, deviceTimestampRange] in devicesTimestampsRange" :value="deviceTimestampRange.deviceId">
          {{ deviceId }} ({{ deviceTimestampRange.timestampFrom }})
        </option>
      </datalist>
      <span :hidden="deviceId == null">SINCE DATE:</span>
      <datetime
        style="display: inline-block;"
        type="date"
        v-model="historyStartDatetime"
        :min-datetime="minDeviceTimestamp"
        :max-datetime="maxDeviceTimestamp"
        :hidden="deviceId == null">
      </datetime>
      <button @click="get_history" id="get_history" :hidden="deviceId == null || this.history">
        Load history
      </button>
      <button @click="reload_history" id="reload_history" :hidden="deviceId == null || this.history == null || this.history.length == 0">
        Reload history
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
  </div>
</template>

<script>
import VueElementLoading from 'vue-element-loading'
import {mapGetters, mapMutations} from 'vuex'
import axios from 'axios'
import {env} from '../../config/env'
import {calculateDistance, getCircleIcon, getMarkerIcon, getMarkerPopUp, getSliderDiv, setZIndex} from '../function'
import {DeviceTimestampsRange, Localization, MarkerTimestamp} from '../data-class'
import 'vue-datetime/dist/vue-datetime.css'
import { Datetime } from 'vue-datetime'
import $ from 'jquery'
import 'jquery-ui-bundle'
import 'jquery-ui-bundle/jquery-ui.min.css'
import dateFormat from 'dateformat'
import L from 'leaflet'
import SelectDevice from './top_panel/SelectDevice.vue'

export default {
  name: 'Menu',
  components: {
    SelectDevice,
    VueElementLoading,
    datetime: Datetime
  },
  computed: {
    totalDistanceString: function () {
      return (this.totalDistance <= 1000
        ? this.totalDistance.toPrecision(6)
        : (this.totalDistance / 1000).toPrecision(6)) +
        (this.totalDistance <= 1000 ? ' [m]' : ' [km]')
    },
    getHistoryStartDatetime: function () {
      let sinceDateTime = new Date()
      console.log(this.historyDaysBack)
      sinceDateTime.setDate(sinceDateTime.getDate() - this.historyDaysBack)
      return sinceDateTime.toISOString()
    },
    ...mapGetters([
      'chosenOption',
      'map',
      'chosenDeviceId',
      'dateTimeStringRange',
      'historyDaysBack'
    ])
  },
  created () {
    this.historyStartDatetime = this.getHistoryStartDatetime
  },
  data () {
    return {
      historyStartDatetime: null,
      deviceId: null,
      devices: [],
      devicesTimestampsRange: null,
      sortedMarkersFromHistory: [],
      minDeviceTimestamp: null,
      maxDeviceTimestamp: null,
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
      handler (newDeviceId, oldDeviceId) {
        this.clear_history_data()

        if (newDeviceId === '') {
          this.setChosenDeviceId(null)
        } else {
          let deviceTimestampsRange = this.devicesTimestampsRange.get(newDeviceId)
          this.minDeviceTimestamp = new Date(deviceTimestampsRange.timestampFrom).toISOString()
          this.maxDeviceTimestamp = new Date(deviceTimestampsRange.timestampTo).toISOString()
          axios.get(env.API_URL + '/get_localization?device_id=' + newDeviceId).then(response => {
            let localization = JSON.parse(response.data)
            let latLng = [localization.lat, localization.lon]
            let greenIcon = getMarkerIcon('green')
            this.chosenDeviceMarker = L.marker(latLng, {icon: greenIcon}).addTo(this.map)
            setZIndex(this.map, this.chosenDeviceMarker, 102)
            this.chosenDeviceMarker.bindPopup(
              getMarkerPopUp(
                'Chosen device',
                newDeviceId,
                localization.timestamp_str
              )
            )
            this.map.setView(latLng, 16)
            this.setChosenDeviceId(newDeviceId)
          })
        }
      }
    },
    datetimeFrom: {
      deep: true,
      handler (newValue, oldValue) {
        this.draw_device_history()
      }
    },
    datetimeTo: {
      deep: true,
      handler (newValue, oldValue) {
        this.draw_device_history()
      }
    },
    pathMode: {
      deep: true,
      handler (newValue, oldValue) {
        this.reload_slider()
        this.draw_device_history()
      }
    },
    historyStartDatetime: {
      deep: true,
      handler (newValue, oldValue) {
        let dateTime = new Date(newValue)
        const diffTime = Math.abs(new Date() - dateTime)
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        this.setHistoryDaysBack(diffDays)
      }
    }
  },
  mounted: function () {
    axios.get(env.API_URL + '/get_devices_timestamps_range').then(response => {
      let responseList = JSON.parse(response.data.replaceAll('\'', ''))
      this.devicesTimestampsRange = new Map()

      for (let index = 0; index < responseList.length; index++) {
        let deviceTimestamp = responseList[index]
        this.devicesTimestampsRange.set(
          deviceTimestamp.device_id,
          new DeviceTimestampsRange(
            deviceTimestamp.device_id,
            deviceTimestamp.timestamp_from,
            deviceTimestamp.timestamp_to
          )
        )
      }
    })
  },
  methods: {
    clear_history_data () {
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
    change_mode () {
      this.pathMode = this.pathMode === false
    },
    draw_device_history () {
      if (this.chosenDeviceMarker) {
        this.chosenDeviceMarker.remove()
      }

      this.clear_path_elements()

      if (this.pathMode) {
        this.draw_polyline()
      } else {
        this.draw_marker_in_timestamp()
      }
    },
    draw_marker_in_timestamp () {
      if (this.datetimeFrom == null) {
        return
      }

      this.clear_path_elements()
      this.load_markers_from_history()
      this.totalDistance = 0

      for (let markerTimestamp of this.sortedMarkersFromHistory) {
        if (markerTimestamp.timestamp >= this.datetimeFrom) {
          this.marker_from = markerTimestamp.marker
          this.marker_from.bindPopup(
            getMarkerPopUp(
              'Chosen timestamp',
              this.chosenDeviceId,
              this.datetimeFrom.toLocaleString('pl'),
              dateFormat(this.datetimeFrom, 'yyyy-mm-dd-HH-MM-ss')
            ))
          this.marker_from.addTo(this.map)
          break
        }
      }

      let markers = Array.from(this.sortedMarkersFromHistory, (markerFromHistory) => markerFromHistory.marker)
      markers.push(this.chosenDeviceMarker)
      let group = L.featureGroup(markers)
      this.map.fitBounds(group.getBounds(), {padding: [50, 50]})
    },
    load_markers_from_history (reload = false) {
      if (this.sortedMarkersFromHistory.length && reload === false) {
        return
      }

      let redIcon = getCircleIcon('red')
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
    draw_polyline () {
      if (this.datetimeFrom == null || this.datetimeTo == null || this.pathMode === false) {
        return
      }

      this.load_markers_from_history()
      let markerFromFound = false
      let markerToFound = false
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

        if (markerFromFound === false && markerTimestamp.timestamp >= this.datetimeFrom) {
          this.marker_from = markerTimestamp.marker
          this.marker_from.bindPopup(
            getMarkerPopUp(
              'Start point',
              this.chosenDeviceId,
              this.datetimeFrom.toLocaleString('pl'),
              dateFormat(this.datetimeFrom, 'yyyy-mm-dd-HH-MM-ss')
            ))
          this.marker_from.addTo(this.map)
          markerFromFound = true
        }

        if (markerToFound === false && markerTimestamp.timestamp >= this.datetimeTo) {
          this.marker_to = markerTimestamp.marker
          this.marker_to.setIcon(getCircleIcon('green'))
          this.marker_to.bindPopup(
            getMarkerPopUp(
              'End point',
              this.chosenDeviceId,
              this.datetimeTo.toLocaleString('pl'),
              dateFormat(this.datetimeTo, 'yyyy-mm-dd-HH-MM-ss')
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
    remove_history () {
      this.clear_path_elements()
      this.polyline = null
    },
    load_history (reload = false) {
      this.isLoading = true

      return new Promise(resolve => {
        if (reload === false && this.history) {
          resolve(true)
          return
        }

        setTimeout(() => {
          let dateTimeRange = this.dateTimeStringRange
          console.log(this.dateTimeStringRange)
          let parameters = '?device_id=' + this.chosenDeviceId + '&from=' + dateTimeRange.fromString + '&to=' + dateTimeRange.toString

          axios.get(env.API_URL + '/get_localizations' + parameters).then(response => {
            let localizations = JSON.parse(response.data.replaceAll('\'', ''))
            this.history = new Map()

            if (localizations === null || localizations.length === 0) {
              resolve(true)
              return
            }

            let dtFrom = localizations[0].timestamp_str
            let dtTo = localizations[localizations.length - 1].timestamp_str
            this.datetimeFrom = Date.parse(dtFrom)
            this.datetimeTo = Date.parse(dtTo)

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
        }, 10)
        setTimeout(() => resolve(false), 30000)
      })
    },
    async reload_history () {
      this.get_history(true)
    },
    async get_history (reload = false) {
      let loadingSucceed = await this.load_history(reload)

      if (loadingSucceed === false) {
        this.isLoading = false
        alert('Loading device history failed')
        return
      }

      this.load_markers_from_history(reload)
      this.reload_slider()
      this.isLoading = false
    },
    reload_slider () {
      console.log('reload_slider')
      if (this.sortedMarkersFromHistory === null || this.sortedMarkersFromHistory.length === 0) {
        return
      }
      console.log('reload_slider 2')

      this.datetimeFrom = new Date(this.sortedMarkersFromHistory[0].timestamp)
      this.datetimeTo = new Date(this.sortedMarkersFromHistory[this.sortedMarkersFromHistory.length - 1].timestamp)
      $('#slider-from').html(this.datetimeFrom.toLocaleString('pl'))
      $('#slider-to').html(this.datetimeTo.toLocaleString('pl'))
      let fromVal = this.datetimeFrom / 1000
      let toVal = this.datetimeTo / 1000
      let mapComponent = this
      $('#slider').remove()
      $('<div>', {
        id: 'slider'
      }).appendTo('#time-range')

      if (this.pathMode) {
        $('#slider').slider({
          range: true,
          min: fromVal,
          max: toVal,
          step: 10,
          values: [fromVal, toVal],
          slide: function (e, ui) {
            mapComponent.datetimeFrom = new Date(ui.values[0] * 1000)
            $('#slider-from').html(mapComponent.datetimeFrom.toLocaleString('pl'))
            mapComponent.datetimeTo = new Date(ui.values[1] * 1000)
            $('#slider-to').html(mapComponent.datetimeTo.toLocaleString('pl'))
          }
        })
      } else {
        $('#slider').slider({
          range: false,
          min: fromVal,
          max: toVal,
          step: 10,
          value: fromVal,
          slide: function (e, ui) {
            mapComponent.datetimeFrom = new Date(ui.value * 1000)
            $('#slider-from').html(mapComponent.datetimeFrom.toLocaleString('pl'))
            $('#slider-to').html('')
          }
        })
      }
    },
    ...mapMutations([
      'setChosenDeviceId',
      'setHistoryDaysBack'
    ])
  }
}
</script>

<style scoped>

#menu {
  height: 50px;
  width: 96vw;
  position: relative;
  z-index: 9999;
  left: 50px;
  bottom: 100vh;
  background-color: rgba(230, 230, 230, 1.0);
  color: #333333;
}

#time-range p {
  font-family: "Arial", sans-serif;
  font-size: 14px;
  color: #333;
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
  content: "";
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
  outline: none;
}

#slider-from {
  float: left;
  width: 46vw;
  margin: 1vw;
}

#slider-to {
  float: left;
  text-align: right;
  width: 46vw;
  margin: 1vw;
}

#slider-caption {
  width: 96vw;
}

</style>
