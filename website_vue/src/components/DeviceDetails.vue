<template>
  <modal name="device-details"
         classes="modal-override"
         :height="'auto'"
         :addaptive="true"
         @before-close="closeModal"
  >
    <div class="main">
      <img alt='' class="view-img" :src='this.img_src'/>
      <div>Device ID: {{ this.chosenDeviceId }}</div>
      <div>{{ this.timestamp ? ("Timestamp: " + this.timestamp.toLocaleString("pl")) : '' }}</div>
    </div>
  </modal>
</template>

<script>
import Vue from 'vue'
import vmodal from 'vue-js-modal'
import {mapGetters, mapMutations} from 'vuex'
import {env} from '../../config/env'
import dateFormat from 'dateformat'

Vue.use(vmodal)

export default {
  name: 'DeviceDetails',
  data () {
    return {
      timestamp: null
    }
  },
  methods: {
    show () {
      this.$modal.show('device-details')
    },
    hide () {
      this.$modal.hide('device-details')
    },
    closeModal () {
      this.setChosenOption('home')
    },
    ...mapMutations([
      'setChosenOption'
    ])
  },
  computed: {
    img_src: function () {
      return env.API_URL + '/view?device_id=' + this.chosenDeviceId +
        (this.timestamp ? ('&timestamp=' + dateFormat(this.timestamp, 'yyyy-mm-dd-HH-MM-ss')) : '')
    },
    ...mapGetters([
      'chosenDeviceId',
      'chosenOption'
    ])
  },
  watch: {
    chosenOption: {
      deep: true,
      handler (newValue) {
        if (newValue === 'view') {
          this.show()
        } else {
          this.hide()
        }
      }
    }
  },
  mount () {
    this.show()
  }
}
</script>

<style>
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
  height: 70vh;
  display: inline-block;
}
</style>
