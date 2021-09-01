'use strict'
const merge = require('webpack-merge')
const devEnv = require('../.env.production')


module.exports = merge(devEnv, {
	NODE_ENV: '"production"'
})
