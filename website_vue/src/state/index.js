import { DateTimeStringRange } from '../data-class'
import dateFormat from 'dateformat'
import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    debug: true,
    map: null,
    chosenDeviceId: null,
    defaultDaysRange: 2,
    historyDaysBack: 2
  },
  mutations: {
    setMap (state, map) {
      if (state.debug) console.log('setMap triggered')
      state.map = map
    },
    setChosenDeviceId (state, chosenDeviceId) {
      if (state.debug) console.log('setChosenDeviceId triggered')
      state.chosenDeviceId = chosenDeviceId
    },
    setHistoryDaysBack (state, daysBack) {
      if (state.debug) console.log('setHistoryDaysBack triggered')
      state.historyDaysBack = Math.max(state.defaultDaysRange, daysBack)
    }
  },
  getters: {
    map: state => {
      if (state.debug) console.log('getters map triggered')
      return state.map
    },
    chosenDeviceId: state => {
      if (state.debug) console.log('getters chosenDeviceId triggered')
      return state.chosenDeviceId
    },
    defaultDaysRange: state => {
      if (state.debug) console.log('getters defaultDaysRange triggered')
      return state.defaultDaysRange
    },
    historyDaysBack: state => {
      if (state.debug) console.log('getters historyDaysBack triggered')
      return state.historyDaysBack
    },
    dateTimeStringRange: state => {
      if (state.debug) console.log('getters dateTimeStringRange triggered')
      let fromDateTime = new Date()
      fromDateTime.setDate(fromDateTime.getDate() - state.historyDaysBack)
      let toDateTime = new Date()
      toDateTime.setDate(toDateTime.getDate() - state.historyDaysBack + state.defaultDaysRange)
      if (state.debug) {
        console.log(dateFormat(fromDateTime, 'yyyy-mm-dd-HH-MM-ss'))
        console.log(dateFormat(toDateTime, 'yyyy-mm-dd-HH-MM-ss'))
      }
      return new DateTimeStringRange(
        dateFormat(fromDateTime, 'yyyy-mm-dd-HH-MM-ss'),
        dateFormat(toDateTime, 'yyyy-mm-dd-HH-MM-ss')
      )
    }
  }
})
