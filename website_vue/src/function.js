import {env} from "../config/env";

export function getMarkerPopUp(title, device_id, timestamp, view_timestamp) {
	let imgSrc = env.API_URL + '/view?device_id=' + device_id +
		(view_timestamp ? ('&timestamp=' + view_timestamp) : '');
	return "<div style='margin: 0 auto;text-align: center;'>" +
		"<div>" + title + "</div>" +
		(device_id ? ("<img alt='' " +
			"style='height:80px;max-width:80px;width: expression(this.width > 80 ? 80: true);'" +
		" src='" + imgSrc + "'/>") : "")  +
		(device_id ? ("<div>ID: " + device_id + "</div>") : "")  +
		"<div>T: " + timestamp + "</div>" +
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

export function getSliderDiv() {
	return '<div id="slider"></div>'
}
