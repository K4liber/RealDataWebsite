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
import {mapGetters} from 'vuex'

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
      'chosenOption'
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
