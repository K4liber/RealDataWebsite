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
    historyDaysBack: 2,
    chosenOption: 'device',
    devicesTimestampsRange: [],
    isLoading: false,
    localizationHistory: [],
    rangeFrom: null,
    rangeTo: null
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
    },
    setChosenOption (state, chosenOption) {
      if (state.debug) console.log('setChosenOption triggered')
      state.chosenOption = chosenOption
    },
    setDevicesTimestampsRange (state, devicesTimestampsRange) {
      if (state.debug) console.log('setDevicesTimestampsRange triggered')
      state.devicesTimestampsRange = devicesTimestampsRange
    },
    setIsLoading (state, isLoading) {
      if (state.debug) console.log('setIsLoading triggered')
      state.isLoading = isLoading
    },
    setLocalizationHistory (state, localizationHistory) {
      if (state.debug) console.log('setLocalizationHistory triggered')
      state.localizationHistory = localizationHistory
    },
    setRangeFrom (state, rangeFrom) {
      if (state.debug) console.log('setRangeFrom triggered')
      state.rangeFrom = rangeFrom
    },
    setRangeTo (state, rangeTo) {
      if (state.debug) console.log('setRangeTo triggered')
      state.rangeTo = rangeTo
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
    },
    chosenOption: state => {
      if (state.debug) console.log('getters chosenOption triggered')
      return state.chosenOption
    },
    devicesTimestampsRange: state => {
      if (state.debug) console.log('getters devicesTimestampsRange triggered')
      return state.devicesTimestampsRange
    },
    isLoading: state => {
      if (state.debug) console.log('getters isLoading triggered')
      return state.isLoading
    },
    localizationHistory: state => {
      if (state.debug) console.log('getters localizationHistory triggered')
      return state.localizationHistory
    },
    rangeFrom: state => {
      if (state.debug) console.log('getters rangeFrom triggered')
      return state.rangeFrom
    },
    rangeTo: state => {
      if (state.debug) console.log('getters rangeTo triggered')
      return state.rangeTo
    }
  }
})
