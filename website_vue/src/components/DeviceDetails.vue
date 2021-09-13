<template>
	<modal name="device-details" height="auto">
		<div>Device ID: {{this.chosenDeviceId}}</div>
		<img :src='this.img_src'/>
	</modal>
</template>

<script>
import Vue from "vue";
import vmodal from 'vue-js-modal'
import {mapGetters} from "vuex";
import {env} from "../../config/env";
Vue.use(vmodal)

export default {
	name: 'DeviceDetails',
	data() {
		return {
			is_open: false,
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
			return env.API_URL + '/view?device_id=' + this.chosenDeviceId
		}
	},
	mount () {
        this.show()
    }
}
</script>

<style></style>
