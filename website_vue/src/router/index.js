import Vue from 'vue'
import Router from 'vue-router'
import Main from '@/components/Main'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'home',
      component: Main
    },
    {
      path: '/home/:device_id?',
      name: 'home',
      component: Main
    },
    {
      path: '/device/:device_id?',
      name: 'device',
      component: Main
    },
    {
      path: '/history/:device_id',
      name: 'history',
      component: Main
    },
    {
      path: '/calendar/:device_id',
      name: 'calendar',
      component: Main
    },
    {
      path: '/view/:device_id',
      name: 'view',
      component: Main
    },
    {
      path: '/home',
      name: 'home',
      component: Main
    }
  ]
})
