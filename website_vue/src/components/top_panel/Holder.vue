<template>
  <div class="holder">
    <vue-element-loading :active="isLoading" :is-full-screen="true"
                         background-color="rgba(255, 255, 255, .7)"/>
    <select-device v-if="chosenOption === 'device'"/>
    <localization-history v-if="chosenOption === 'history'"/>
    <calendar v-if="chosenOption === 'calendar'"/>
    <home v-if="chosenOption === 'home'"/>
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
  width: 96vw;
  position: relative;
  padding: 0;
  margin: 0;
  z-index: 9999;
  left: 50px;
  bottom: 100vh;
  background-color: rgb(112, 207, 128);
  color: #333333;
}

</style>
