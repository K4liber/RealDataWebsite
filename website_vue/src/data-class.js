export class Localization {
  constructor (lat, lon, timestampStr) {
    this.lat = lat
    this.lon = lon
    this.timestampStr = timestampStr
  }
}

export class DeviceTimestamp {
  constructor (deviceId, timestampStr) {
    this.device_id = deviceId
    this.timestampStr = timestampStr
  }
}

export class MarkerTimestamp {
  constructor (timestamp, marker) {
    this.timestamp = timestamp
    this.marker = marker
  }
}
