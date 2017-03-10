import { App, Server } from 'corpjs-express'
import Config, { loaders, processors } from 'corpjs-config'
import Endpoints from 'corpjs-endpoints'
import Router from './Router'
import System from 'corpjs-system'
import Logger from 'corpjs-logger'
const { name } = require('../../package.json')

export default new System({ name })
    .add('config', new Config()
        .add(config => loaders.require({ path: './config/default.js', mandatory: true })))
    .add('logger', Logger()).dependsOn({ component: 'config', source: 'logger', as: 'config' })
    .add('endpoints', Endpoints()).dependsOn({ component: 'config', source: 'endpoints', as: 'config' })
    .add('app', App())
    .add('router', Router()).dependsOn('app', 'endpoints', 'logger')
    .add('server', Server()).dependsOn('app', 'router', { component: 'config', source: 'server', as: 'config' })
    .logAllEvents()