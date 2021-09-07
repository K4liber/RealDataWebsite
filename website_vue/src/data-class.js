export class Localization {
  constructor(lat, lon, timestampStr) {
    this.lat = lat;
    this.lon = lon;
	this.timestampStr = timestampStr;
  }
}

export class DeviceTimestamp {
  constructor(device_id, timestampStr) {
    this.device_id = device_id;
	this.timestampStr = timestampStr;
  }
}
