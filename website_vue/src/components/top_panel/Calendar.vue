<template>
    <div class="main">
      <datetime
        style="display: inline-block;"
        type="date"
        v-model="historyStartDatetime"
        :min-datetime="rangeFrom ? rangeFrom.toISOString() : null"
        :max-datetime="rangeTo ? rangeTo.toISOString() : null"
        :hidden="chosenOption !== 'calendar'">
      </datetime>
    </div>
</template>

<script>
import {Datetime} from 'vue-datetime'
import {mapGetters, mapMutations} from 'vuex'
import 'vue-datetime/dist/vue-datetime.css'

export default {
  name: 'Calendar',
  components: {
    datetime: Datetime
  },
  methods: {
    ...mapMutations([
      'setHistoryStartDate',
      'setHistoryStopDate',
      'setChosenOption'
    ])
  },
  watch: {
    historyStartDatetime: {
      deep: true,
      handler (newValue) {
        let historyStartDate = new Date(newValue)
        this.setHistoryStartDate(historyStartDate)
        let dateOffset = (24 * 60 * 60 * 1000) * this.defaultDaysRange
        let historyStopDate = new Date()
        historyStopDate.setTime(historyStartDate.getTime() + dateOffset)

        if (historyStopDate > this.rangeTo && this.rangeTo !== null) {
          this.setHistoryStopDate(this.rangeTo)
        } else {
          this.setHistoryStopDate(historyStopDate)
        }

        if (this.chosenDeviceId && this.chosenOption === 'calendar') {
          this.setChosenOption('history')
        }
      }
    }
  },
  computed: {
    ...mapGetters([
      'chosenDeviceId',
      'defaultDaysRange',
      'chosenOption',
      'rangeFrom',
      'rangeTo'
    ]),
    getHistoryStartDatetime: function () {
      let sinceDateTime = new Date()
      sinceDateTime.setDate(sinceDateTime.getDate() - this.defaultDaysRange + 1)
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
