export class Localization {
  constructor (lat, lon, timestampStr) {
    this.lat = lat
    this.lon = lon
    this.timestampStr = timestampStr
  }
}

export class DeviceTimestampsRange {
  constructor (deviceId, timestampFrom, timestampTo) {
    this.deviceId = deviceId
    this.timestampFrom = timestampFrom
    this.timestampTo = timestampTo
  }
}

export class MarkerTimestamp {
  constructor (timestamp, marker) {
    this.timestamp = timestamp
    this.marker = marker
  }
}

export class DateTimeStringRange {
  constructor (fromString, toString) {
    this.fromString = fromString
    this.toString = toString
  }
}
