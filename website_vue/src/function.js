export function getMarker(device_id, timestamp) {
	return "<div style='margin: 0 auto;'>" +
		"<img style='width: 80px;' :src='image'/>" +
		"<br>" + device_id +
		"<br>" + timestamp +
		"</div>"
}

export function calcCrow(lat1, lon1, lat2, lon2) {
	let R = 6371000; // [m]
	let dLat = toRad(lat2-lat1);
	let dLon = toRad(lon2-lon1);
	let lat1_rad = toRad(lat1);
	let lat2_rad = toRad(lat2);

	let a = Math.sin(dLat/2) * Math.sin(dLat/2) +
	Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1_rad) * Math.cos(lat2_rad);
	let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	let d = R * c;
	return d;
}

function toRad(degrees) {
	return degrees * Math.PI / 180;
}
