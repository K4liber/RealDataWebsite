<template>
    <div class="main">
      LocalizationHistory
    </div>
</template>

<script>
import {Localization} from '../../data-class'
import axios from 'axios'
import {env} from '../../../config/env'
import {mapMutations, mapGetters} from 'vuex'

export default {
  name: 'LocalizationHistory',
  data () {
    return {}
  },
  computed: {
    ...mapGetters([
      'chosenDeviceId',
      'dateTimeStringRange'
    ])
  },
  mounted: function () {
    this.load_history()
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
          console.log(this.dateTimeStringRange)
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

.main {
  left: 50px;
  text-align: left;
}

</style>
