<template>
    <div class="main">
      <div id="time-range">
        <div id="slider-caption">
          <div id="slider-from"></div>
          <div v-if="pathMode" id="slider-to"></div>
        </div>
        <div id="slider"></div>
      </div>
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
  text-align: left;
  padding-top: 14px;
  padding-left: 10px;
}

#time-range p {
  font-family: "Arial", sans-serif;
  font-size: 14px;
  color: #333;
}

.ui-slider-horizontal {
  height: 8px;
  background: #D7D7D7;
  border: 1px solid #BABABA;
  box-shadow: 0 1px 0 #FFF, 0 1px 0 #CFCFCF inset;
  clear: both;
  margin: 8px 0;
  -webkit-border-radius: 6px;
  -moz-border-radius: 6px;
  -ms-border-radius: 6px;
  -o-border-radius: 6px;
  border-radius: 6px;
}

.ui-slider {
  position: relative;
  text-align: left;
}

.ui-slider-horizontal .ui-slider-range {
  top: -1px;
  height: 100%;
}

.ui-slider .ui-slider-range {
  position: absolute;
  z-index: 1;
  height: 8px;
  font-size: .7em;
  display: block;
  border: 1px solid #5BA8E1;
  box-shadow: 0 1px 0 #AAD6F6 inset;
  -moz-border-radius: 6px;
  -webkit-border-radius: 6px;
  -khtml-border-radius: 6px;
  border-radius: 6px;
  background: #81B8F3;
  background-image: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgi…pZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JhZCkiIC8+PC9zdmc+IA==');
  background-size: 100%;
  background-image: -webkit-gradient(linear, 50% 0, 50% 100%, color-stop(0%, #A0D4F5), color-stop(100%, #81B8F3));
  background-image: -webkit-linear-gradient(top, #A0D4F5, #81B8F3);
  background-image: -moz-linear-gradient(top, #A0D4F5, #81B8F3);
  background-image: -o-linear-gradient(top, #A0D4F5, #81B8F3);
  background-image: linear-gradient(top, #A0D4F5, #81B8F3);
}

.ui-slider .ui-slider-handle {
  border-radius: 50%;
  background: #F9FBFA;
  background-image: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgi…pZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JhZCkiIC8+PC9zdmc+IA==');
  background-size: 100%;
  background-image: -webkit-gradient(linear, 50% 0, 50% 100%, color-stop(0%, #C7CED6), color-stop(100%, #F9FBFA));
  background-image: -webkit-linear-gradient(top, #C7CED6, #F9FBFA);
  background-image: -moz-linear-gradient(top, #C7CED6, #F9FBFA);
  background-image: -o-linear-gradient(top, #C7CED6, #F9FBFA);
  background-image: linear-gradient(top, #C7CED6, #F9FBFA);
  width: 22px;
  height: 22px;
  -webkit-box-shadow: 0 2px 3px -1px rgba(0, 0, 0, 0.6), 0 -1px 0 1px rgba(0, 0, 0, 0.15) inset, 0 1px 0 1px rgba(255, 255, 255, 0.9) inset;
  -moz-box-shadow: 0 2px 3px -1px rgba(0, 0, 0, 0.6), 0 -1px 0 1px rgba(0, 0, 0, 0.15) inset, 0 1px 0 1px rgba(255, 255, 255, 0.9) inset;
  box-shadow: 0 2px 3px -1px rgba(0, 0, 0, 0.6), 0 -1px 0 1px rgba(0, 0, 0, 0.15) inset, 0 1px 0 1px rgba(255, 255, 255, 0.9) inset;
  -webkit-transition: box-shadow .3s;
  -moz-transition: box-shadow .3s;
  -o-transition: box-shadow .3s;
  transition: box-shadow .3s;
}

.ui-slider .ui-slider-handle {
  position: absolute;
  z-index: 2;
  width: 22px;
  height: 22px;
  cursor: default;
  border: none;
  cursor: pointer;
}

.ui-slider .ui-slider-handle:after {
  content: "";
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  top: 50%;
  margin-top: -4px;
  left: 50%;
  margin-left: -4px;
  background: #30A2D2;
  -webkit-box-shadow: 0 1px 1px 1px rgba(22, 73, 163, 0.7) inset, 0 1px 0 0 #FFF;
  -moz-box-shadow: 0 1px 1px 1px rgba(22, 73, 163, 0.7) inset, 0 1px 0 0 white;
  box-shadow: 0 1px 1px 1px rgba(22, 73, 163, 0.7) inset, 0 1px 0 0 #FFF;
}

.ui-slider-horizontal .ui-slider-handle {
  top: -.5em;
  margin-left: -.6em;
}

.ui-slider a:focus {
  outline: none;
}

#slider-from {
  float: left;
  width: 46vw;
  margin: 1vw;
}

#slider-to {
  float: left;
  text-align: right;
  width: 46vw;
  margin: 1vw;
}

#slider-caption {
  width: 96vw;
}

</style>
