<template>
    <div class="main">
      <datetime
        style="display: inline-block;"
        type="date"
        v-model="historyStartDatetime"
        :min-datetime="rangeFrom.toISOString()"
        :max-datetime="rangeTo.toISOString()"
        :hidden="chosenOption !== 'calendar'">
      </datetime>
    </div>
</template>

<script>
import {Datetime} from 'vue-datetime'
import {mapGetters} from 'vuex'
import 'vue-datetime/dist/vue-datetime.css'

export default {
  name: 'Calendar',
  components: {
    datetime: Datetime
  },
  computed: {
    ...mapGetters([
      'chosenOption',
      'rangeFrom',
      'rangeTo',
      'historyDaysBack'
    ]),
    getHistoryStartDatetime: function () {
      let sinceDateTime = new Date()
      console.log(this.historyDaysBack)
      sinceDateTime.setDate(sinceDateTime.getDate() - this.historyDaysBack)
      return sinceDateTime.toISOString()
    }
  },
  data () {
    return {
      historyStartDatetime: null
    }
  },
  created () {
    this.historyStartDatetime = this.getHistoryStartDatetime
  }
}

</script>

<style scoped>

.main {
  text-align: left;
  padding-top: 14px;
  padding-left: 10px;
}

</style>
