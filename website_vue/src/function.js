import {env} from '../config/env'
import L from 'leaflet'

export function getMarkerPopUp (title, deviceId, timestampStr, viewTimestamp) {
  let imgSrc = env.API_URL + '/view?device_id=' + deviceId +
    (viewTimestamp ? ('&timestamp=' + viewTimestamp) : '')
  return "<div style='margin: 0 auto;text-align: center;'>" +
    '<div>' + title + '</div>' +
    (deviceId ? ("<img alt='' " +
      "style='height:80px;max-width:80px;width: expression(this.width > 80 ? 80: true);'" +
      " src='" + imgSrc + "'/>") : '') +
    (deviceId ? ('<div>ID: ' + deviceId + '</div>') : '') +
    '<div>T: ' + new Date(timestampStr + ' +0000').toLocaleString('pl') + '</div>' +
    '</div>'
}

export function calculateDistance (lat1, lon1, lat2, lon2) {
  let R = 6371000 // [m]
  let dLat = toRad(lat2 - lat1)
  let dLon = toRad(lon2 - lon1)
  let lat1Rad = toRad(lat1)
  let lat2Rad = toRad(lat2)

  let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad)
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  let d = R * c
  return d
}

function toRad (degrees) {
  return degrees * Math.PI / 180
}

export function getSliderDiv () {
  return '<div id="slider"></div>'
}

export function getCircleIcon (color) {
  return L.icon({
    iconUrl: '/static/img/marker-' + color + '.png',
    iconAnchor: [12, 12], // marker icon position
    popupAnchor: [0, -12] // popup position
  })
}

export function getMarkerIcon (color) {
  return L.icon({
    iconUrl: '/static/img/marker-icon-' + color + '.png',
    shadowUrl: '/static/img/marker-shadow.png',
    iconAnchor: [13, 40], // marker icon position
    popupAnchor: [0, -36] // popup position
  })
}

export function setZIndex (leafletMap, marker, zIndex) {
  let position = leafletMap.latLngToLayerPoint(marker.getLatLng()).round()
  marker.setZIndexOffset(zIndex - position.y)
}

export function toDate (dateString, format, delimiter) {
  var formatedDate = null
  var formatItems = format.split(delimiter)
  var dateItems = dateString.split(delimiter)
  var monthIndex = formatItems.indexOf('mm')
  var dayIndex = formatItems.indexOf('dd')
  var yearIndex = formatItems.indexOf('yyyy')
  var hourIndex = formatItems.indexOf('HH')
  var minuteIndex = formatItems.indexOf('MM')
  var secondIndex = formatItems.indexOf('ss')
  formatedDate = new Date(
    dateItems[yearIndex],
    parseInt(dateItems[monthIndex]) - 1,
    parseInt(dateItems[dayIndex]),
    parseInt(dateItems[hourIndex]),
    parseInt(dateItems[minuteIndex]),
    parseInt(dateItems[secondIndex])
  )
  return formatedDate
}
