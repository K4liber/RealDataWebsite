<template>
  <div class="content">
    <LeftPanel/>
    <LeafletMap/>
    <Menu/>
    <device-details ref="deviceDetails"/>
  </div>
</template>
<script>

import LeafletMap from './LeafletMap'
import Menu from './Menu'
import LeftPanel from './LeftPanel'
import DeviceDetails from './DeviceDetails'
import {mapGetters} from 'vuex'

export default {
  name: 'Main',
  components: {
    LeftPanel,
    LeafletMap,
    DeviceDetails,
    Menu
  },
  computed: {
    ...mapGetters([
      'chosenOption'
    ])
  },
  watch: {
    chosenOption: {
      deep: true,
      handler (newValue) {
        if (newValue === 'view') {
          this.$refs.deviceDetails.show()
        } else {
          this.$refs.deviceDetails.hide()
        }
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
