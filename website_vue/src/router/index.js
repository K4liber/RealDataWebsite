import Vue from 'vue'
import Router from 'vue-router'
import Main from '@/components/Main'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Main',
      component: Main
    },
    {
      path: '/device/:device_id',
      name: 'device_id',
      component: Main
    },
    {
      path: '/home',
      name: 'home',
      component: Main
    }
  ]
})
