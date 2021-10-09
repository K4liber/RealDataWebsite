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
    chosenOption: 'device',
    devicesTimestampsRange: [],
    isLoading: false,
    localizationHistory: [],
    historyStartDate: null,
    historyStopDate: null,
    rangeFrom: null,
    rangeTo: null,
    sliderFrom: null,
    sliderTo: null
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
      if (state.debug) {
        console.log('setLocalizationHistory triggered')
        console.log(localizationHistory)
      }
      state.localizationHistory = localizationHistory
    },
    setHistoryStartDate (state, historyStartDate) {
      if (state.debug) console.log('setHistoryStartDate triggered')
      state.historyStartDate = historyStartDate
    },
    setHistoryStopDate (state, historyStopDate) {
      if (state.debug) console.log('setHistoryStopDate triggered')
      let dateNow = new Date()
      state.historyStopDate = historyStopDate.valueOf() < dateNow.valueOf() ? historyStopDate : dateNow
    },
    setRangeFrom (state, rangeFrom) {
      if (state.debug) console.log('setRangeFrom triggered')
      state.rangeFrom = rangeFrom
    },
    setRangeTo (state, rangeTo) {
      if (state.debug) console.log('setRangeTo triggered')
      state.rangeTo = rangeTo
    },
    setSliderFrom (state, sliderFrom) {
      if (state.debug) console.log('setSliderFrom triggered')
      state.sliderFrom = sliderFrom
    },
    setSliderTo (state, sliderTo) {
      if (state.debug) console.log('setSliderTo triggered')
      state.sliderTo = sliderTo
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
    dateTimeStringRange: state => {
      if (state.debug) {
        console.log('getters dateTimeStringRange triggered')
        console.log(dateFormat(state.historyStartDate, 'yyyy-mm-dd-HH-MM-ss'))
        console.log(dateFormat(state.historyStopDate, 'yyyy-mm-dd-HH-MM-ss'))
      }
      return new DateTimeStringRange(
        dateFormat(state.historyStartDate, 'yyyy-mm-dd-HH-MM-ss'),
        dateFormat(state.historyStopDate, 'yyyy-mm-dd-HH-MM-ss')
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
    historyStartDate: state => {
      if (state.debug) console.log('getters historyStartDate triggered')
      return state.historyStartDate
    },
    historyStopDate: state => {
      if (state.debug) console.log('getters historyStopDate triggered')
      return state.historyStopDate
    },
    rangeFrom: state => {
      if (state.debug) console.log('getters rangeFrom triggered')
      return state.rangeFrom
    },
    rangeTo: state => {
      if (state.debug) console.log('getters rangeTo triggered')
      return state.rangeTo
    },
    sliderFrom: state => {
      if (state.debug) console.log('getters sliderFrom triggered')
      return (state.sliderFrom !== null ? state.sliderFrom : (state.rangeFrom !== null ? state.rangeFrom : new Date()))
    },
    sliderTo: state => {
      if (state.debug) console.log('getters sliderTo triggered')
      return (state.sliderTo !== null ? state.sliderTo : (state.rangeTo !== null ? state.rangeTo : new Date()))
    }
  }
})
