<template>
  <div class="content">
    <LeftPanel/>
    <LeafletMap/>
    <Holder/>
    <device-details ref="deviceDetails"/>
  </div>
</template>
<script>

import LeafletMap from './LeafletMap'
import Holder from './top_panel/Holder'
import LeftPanel from './LeftPanel'
import DeviceDetails from './DeviceDetails'
import {mapGetters, mapMutations} from 'vuex'
import {Localization} from '../data-class'
import axios from 'axios'
import {env} from '../../config/env'

export default {
  name: 'Main',
  components: {
    LeftPanel,
    LeafletMap,
    DeviceDetails,
    Holder
  },
  computed: {
    ...mapGetters([
      'historyStartDate',
      'chosenDeviceId',
      'dateTimeStringRange'
    ])
  },
  watch: {
    historyStartDate: {
      deep: true,
      handler () {
        this.load_history(true)
      }
    },
    chosenDeviceId: {
      deep: true,
      handler () {
        this.load_history(true)
      }
    }
  },
  methods: {
    async load_history (reload = false) {
      let getSucceed = await this.get_history(reload)

      if (getSucceed === false) {
        this.setIsLoading(false)
        alert('Loading device history failed')
        return
      }

      this.setIsLoading(false)
    },
    get_history (reload = false) {
      this.setIsLoading(true)

      return new Promise(resolve => {
        if (reload === false && this.history) {
          resolve(true)
          return
        }

        setTimeout(() => {
          let dateTimeRange = this.dateTimeStringRange
          let parameters = '?device_id=' + this.chosenDeviceId + '&from=' + dateTimeRange.fromString + '&to=' + dateTimeRange.toString

          axios.get(env.API_URL + '/get_localizations' + parameters).then(response => {
            let localizations = JSON.parse(response.data.replaceAll('\'', ''))
            let history = new Map()

            if (localizations === null || localizations.length === 0) {
              resolve(true)
              return
            }

            for (let index = 0; index < localizations.length; index++) {
              let element = localizations[index]
              history.set(
                Date.parse(element.timestamp_str),
                new Localization(
                  element.lat,
                  element.lon,
                  element.timestamp_str
                )
              )
            }

            this.setLocalizationHistory(history)
            resolve(true)
          })
        }, 10)
        setTimeout(() => resolve(false), 30000)
      })
    },
    ...mapMutations([
      'setLocalizationHistory',
      'setIsLoading'
    ])
  }
}
</script>

<style scoped>

.content {
  position: absolute;
  overflow: hidden;
  width: 100vw;
  height: 100vh;
  padding: 0;
  margin: 0;
}

</style>
