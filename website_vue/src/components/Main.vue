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
      'chosenOption',
      'isDeviceIdCorrect',
      'dateTimeStringRange',
      'localizationHistory'
    ])
  },
  watch: {
    chosenOption: {
      deep: true,
      handler (newValue) {
        if (newValue === 'history') {
          this.load_history(false)
        }

        let deviceIdFromURL = this.$route.params.device_id
        let deviceId = this.chosenDeviceId || deviceIdFromURL
        let params = deviceId ? '/' + deviceId : ''
        this.$router.push('/' + newValue + params)
      }
    }
  },
  methods: {
    async load_history (reload) {
      if (reload) {
        this.setLocalizationHistory([])
      }

      this.setIsLoading(true)
      var self = this

      await this.get_history().then(
        function (value) {
          if (value) {
            self.setIsLoading(false)
          }
        }
      )
    },
    get_history () {
      return new Promise(resolve => {
        setTimeout(() => {
          let dateTimeRange = this.dateTimeStringRange
          let parameters = '?device_id=' + this.chosenDeviceId + '&from=' + dateTimeRange.fromString + '&to=' + dateTimeRange.toString

          axios.get(env.API_URL + '/get_localizations' + parameters).then(response => {
            let localizations = JSON.parse(response.data.replaceAll('\'', ''))
            let history = []

            if (localizations === null || localizations.length === 0) {
              resolve(true)
              return
            }

            this.setIsDeviceIdCorrect(true)

            for (let index = 0; index < localizations.length; index++) {
              let element = localizations[index]
              history.push(
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
        setTimeout(() => resolve(false), 120000)
      })
    },
    ...mapMutations([
      'setLocalizationHistory',
      'setIsLoading',
      'setChosenDeviceId',
      'setIsDeviceIdCorrect',
      'setChosenOption'
    ])
  },
  mounted: function () {
    if (this.$route.matched.length > 0) {
      let firstMatched = this.$route.matched[0]

      if (firstMatched.name) {
        let deviceIdFromURL = this.$route.params.device_id

        if (deviceIdFromURL && deviceIdFromURL !== this.chosenDeviceId) {
          this.setChosenDeviceId(deviceIdFromURL)
        }

        this.setChosenOption(firstMatched.name)
      }
    }
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
