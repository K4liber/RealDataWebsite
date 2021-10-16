<template>
  <modal name="device-details"
         classes="modal-override"
         :height="'auto'"
         :adaptive=true
         @before-close="closeModal"
  >
    <div class="main">
      <div id="view_holder">
        <div id="left" class="center clickable" @click="showPreviousView">{{ this.previousView ? "&#9664;" : ""}}</div>
          <div id="view" class="center">
            <img alt='' class="view-img" :src='this.imgSrc'/>
          </div>
        <div id="right" class="center clickable" @click="showNextView">{{ this.nextView ? "&#9654;" : "" }}</div>
      </div>
      <div>Device ID: {{ this.chosenDeviceId }}</div>
      <div>{{ this.currentView ? ("Timestamp: " + this.viewTimestamp) : '' }}</div>
    </div>
  </modal>
</template>

<script>
import Vue from 'vue'
import vmodal from 'vue-js-modal'
import {mapGetters, mapMutations} from 'vuex'
import {env} from '../../config/env'
import dateFormat from 'dateformat'
import axios from 'axios'
import {toDate} from '../function'

Vue.use(vmodal)

export default {
  name: 'DeviceDetails',
  data () {
    return {
      imgSrc: null,
      viewHistory: [],
      currentView: null,
      previousView: null,
      nextView: null
    }
  },
  methods: {
    reloadPreviousAndNext () {
      for (let index = 0; index < this.viewHistory.length; index++) {
        let element = this.viewHistory[index].replace(/\.[^/.]+$/, '')

        if (element === this.currentView) {
          let nextIndex = index + 1
          let previousIndex = index - 1

          if (nextIndex < this.viewHistory.length) {
            this.previousView = this.viewHistory[nextIndex].replace(/\.[^/.]+$/, '')
          } else {
            this.previousView = null
          }

          if (previousIndex >= 0) {
            this.nextView = this.viewHistory[previousIndex].replace(/\.[^/.]+$/, '')
          } else {
            this.nextView = null
          }

          break
        }
      }
    },
    showPreviousView () {
      for (let index = 0; index < this.viewHistory.length; index++) {
        let element = this.viewHistory[index].replace(/\.[^/.]+$/, '')

        if (element === this.currentView) {
          let nextIndex = index + 1

          if (nextIndex < this.viewHistory.length) {
            this.currentView = this.viewHistory[nextIndex].replace(/\.[^/.]+$/, '')
            this.imgSrc = this.getCurrentViewSrc()
          }

          break
        }
      }
      this.reloadPreviousAndNext()
    },
    showNextView () {
      for (let index = 0; index < this.viewHistory.length; index++) {
        let element = this.viewHistory[index].replace(/\.[^/.]+$/, '')

        if (element === this.currentView) {
          let newIndex = index - 1

          if (newIndex >= 0) {
            this.currentView = this.viewHistory[newIndex].replace(/\.[^/.]+$/, '')
            this.imgSrc = this.getCurrentViewSrc()
          }

          break
        }
      }
      this.reloadPreviousAndNext()
    },
    show () {
      this.$modal.show('device-details')
    },
    hide () {
      this.$modal.hide('device-details')
    },
    closeModal () {
      this.setChosenOption('home')
    },
    getCurrentViewSrc () {
      return env.API_URL + '/view?device_id=' + this.chosenDeviceId +
        (this.currentView ? ('&timestamp=' + this.currentView) : '')
    },
    loadViewHistory () {
      axios.get(env.API_URL + '/get_view_history?device_id=' + this.chosenDeviceId).then(response => {
        this.viewHistory = response.data

        if (this.viewHistory.length === 0) {
          return ''
        }

        let defaultView = dateFormat(this.historyStartDate, 'yyyy-mm-dd-HH-MM-ss')

        for (let index = 0; index < this.viewHistory.length; index++) {
          let element = this.viewHistory[index].replace(/\.[^/.]+$/, '')

          if (element <= defaultView) {
            this.currentView = element
            break
          }
        }

        this.reloadPreviousAndNext()
      })
    },
    ...mapMutations([
      'setChosenOption'
    ])
  },
  computed: {
    viewTimestamp () {
      let viewDate = toDate(this.currentView, 'yyyy-mm-dd-HH-MM-ss', '-')
      return viewDate.toLocaleString('pl')
    },
    ...mapGetters([
      'chosenDeviceId',
      'historyStartDate',
      'chosenOption'
    ])
  },
  watch: {
    chosenDeviceId: {
      deep: true,
      handler () {
        this.imgSrc = this.loadViewHistory()
      }
    },
    chosenOption: {
      deep: true,
      handler (newValue) {
        if (newValue === 'view') {
          this.imgSrc = this.getCurrentViewSrc()
          this.show()
        } else {
          this.hide()
        }
      }
    },
    historyStartDate: {
      deep: true,
      handler () {
        this.img_src = this.get_img_src
      }
    }
  },
  mount () {
    this.show()
  }
}
</script>

<style scoped>
.modal-override {
  background-color: rgba(200, 200, 200, 0.95) !important;
  max-width: 84% !important;
  max-height: 80% !important;
  text-align: center !important;
  position: absolute !important;
}

@media all and (orientation: portrait) {
  .modal-override {
    width: 84% !important;
    left: 8% !important;
  }
}

.main {
  margin: 0 auto;
  text-align: center;
  padding: 2%;
}

.view-img {
  max-width: 100%;
  max-height: 70vh;
  display: inline-block;
}

#view_holder {
  max-width: 100%;
  overflow: hidden;
}

.center {
  display: flex;
  justify-content: center; /* align horizontal */
  align-items: center; /* align vertical */
}

#left {
  width: 30px;
  float: left;
  height: 70vh;
}

#view {
  width: calc(100% - 60px);
  float: left;
  height: 70vh;
}

#right {
  width: 30px;
  float: right;
  height: 70vh;
}

.clickable {
  cursor: pointer;
}
</style>
