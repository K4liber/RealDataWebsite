<template>
  <div class="holder">
    <vue-element-loading :active="showLoading === true" :is-full-screen="true"
                         background-color="rgba(255, 255, 255, .7)"/>
    <select-device :hidden="chosenOption !== 'device'"/>
    <localization-history :hidden="chosenOption !== 'history'"/>
    <calendar :hidden="chosenOption !== 'calendar'"/>
    <home :hidden="chosenOption !== 'home'"/>
  </div>
</template>

<script>
import {mapGetters} from 'vuex'
import VueElementLoading from 'vue-element-loading'
import SelectDevice from './SelectDevice'
import LocalizationHistory from './LocalizationHistory'
import Home from './Home'
import Calendar from './Calendar'

export default {
  name: 'Holder',
  components: {
    VueElementLoading,
    SelectDevice,
    LocalizationHistory,
    Home,
    Calendar
  },
  data () {
    return {
      showLoading: false
    }
  },
  watch: {
    isLoading: {
      deep: true,
      handler (newValue) {
        this.showLoading = newValue
      }
    }
  },
  computed: {
    ...mapGetters([
      'chosenOption',
      'isLoading'
    ])
  }
}

</script>
<style scoped>

.holder {
  height: 50px;
  width: 100vw;
  position: relative;
  margin-left: 50px;
  z-index: 9999;
  left: 0px;
  bottom: 100vh;
  background-color: rgb(112, 207, 128);
  color: #333333;
}

</style>
