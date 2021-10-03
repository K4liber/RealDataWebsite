<template>
  <div class="holder">
    <vue-element-loading :active="isLoading" :is-full-screen="true"
                         background-color="rgba(255, 255, 255, .7)"/>
    <select-device v-if="chosenOption === 'device'"/>
    <localization-history v-if="chosenOption === 'history'"/>
    <home v-if="chosenOption === 'home'"/>
  </div>
</template>

<script>
import {mapGetters} from 'vuex'
import VueElementLoading from 'vue-element-loading'
import SelectDevice from './SelectDevice'
import LocalizationHistory from './LocalizationHistory'
import Home from './Home'

export default {
  name: 'Holder',
  components: {
    VueElementLoading,
    SelectDevice,
    LocalizationHistory,
    Home
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
  background-color: rgba(230, 230, 230, 1.0);
  color: #333333;
}

</style>
