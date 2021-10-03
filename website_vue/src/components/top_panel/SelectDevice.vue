<template>
  <div class="select_device_panel">
    <input list="device_ids" name="device_id" id="device_id" v-model="deviceId" placeholder="Select device ID">
    <datalist id="device_ids">
      <option :key="deviceId"
              v-for="[deviceId, deviceTimestampRange] in devicesTimestampsRange" :value="deviceTimestampRange.deviceId">
          {{ deviceId }} ({{ deviceTimestampRange.timestampFrom }})
      </option>
    </datalist>
  </div>
</template>

<script>
import {mapMutations, mapGetters} from 'vuex'
import axios from 'axios'
import {env} from '../../../config/env'
import {DeviceTimestampsRange} from '../../data-class'

export default {
  name: 'SelectDevice',
  data () {
    return {
      deviceId: null
    }
  },
  watch: {
    deviceId: {
      deep: true,
      handler (newValue) {
        if (newValue !== null) {
          this.setChosenDeviceId(newValue)
        }
      }
    }
  },
  methods: {
    ...mapMutations([
      'setChosenDeviceId',
      'setDevicesTimestampsRange',
      'setRangeFrom',
      'setRangeTo'
    ])
  },
  computed: {
    ...mapGetters([
      'devicesTimestampsRange'
    ])
  },
  mounted: function () {
    axios.get(env.API_URL + '/get_devices_timestamps_range').then(response => {
      let responseList = JSON.parse(response.data.replaceAll('\'', ''))
      let devicesTimestampsRange = new Map()

      for (let index = 0; index < responseList.length; index++) {
        let deviceTimestamp = responseList[index]
        devicesTimestampsRange.set(
          deviceTimestamp.device_id,
          new DeviceTimestampsRange(
            deviceTimestamp.device_id,
            deviceTimestamp.timestamp_from,
            deviceTimestamp.timestamp_to
          )
        )
      }

      this.setDevicesTimestampsRange(devicesTimestampsRange)
    })
  }
}

</script>
<style scoped>

.select_device_panel{
  text-align: left;
  padding-top: 14px;
  padding-left: 10px;
}

</style>
