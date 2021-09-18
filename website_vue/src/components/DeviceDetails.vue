<template>
	<modal name="device-details"
		:height="'auto'"
	>
		<div style='margin: 0 auto;text-align: center;'>
			<img alt='' style='max-height:80vh;max-width:80vw;' :src='this.img_src'/>
			<div>Device ID: {{this.chosenDeviceId}}</div>
			<div>{{this.timestamp ? ("Timestamp: " + this.timestamp.toLocaleString("pl")) : ''}}</div>
		</div>
	</modal>
</template>

<script>
import Vue from "vue";
import vmodal from 'vue-js-modal'
import {mapGetters} from "vuex";
import {env} from "../../config/env";
import dateFormat from "dateformat";
Vue.use(vmodal)

export default {
	name: 'DeviceDetails',
	data() {
		return {
			timestamp: null,
		}
	},
	methods: {
		show() {
			this.$modal.show('device-details');
		},
	},
	computed: {
		...mapGetters([
			'chosenDeviceId'
		]),
		img_src() {
			return env.API_URL + '/view?device_id=' + this.chosenDeviceId +
				(this.timestamp ? ('&timestamp=' + dateFormat(this.timestamp, "yyyy-mm-dd-HH-MM-ss")) : '')
		}
	},
	mount () {
        this.show()
    }
}
</script>

<style></style>
