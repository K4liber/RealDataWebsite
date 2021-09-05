import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

export default new Vuex.Store({
    state: {
		debug: true,
		map: null,
		chosenDeviceId: null
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
    },
	getters: {
		map: state => {
			if (state.debug) console.log('getters map triggered')
			return state.map
		},
		chosenDeviceId: state => {
			if (state.debug) console.log('getters chosenDeviceId triggered')
			return state.chosenDeviceId
		}
	}
});
