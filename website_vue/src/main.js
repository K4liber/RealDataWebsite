import Vue from 'vue'
import App from './App'
import router from './router'
import store from './state'

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>'
})
