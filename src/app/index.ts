import { App, Server } from 'corpjs-express'
import Config, { loaders, processors } from 'corpjs-config'
import Endpoints from 'corpjs-endpoints'
import Router from './Router'
import System from 'corpjs-system'
import Logger from 'corpjs-logger'

const inDevelopment = process.env.NODE_ENV === 'dev'
process.on('unhandledRejection', err => console.error(err))

export default new System({ exitOnError: !inDevelopment })
    .add('config', new Config()
        .add(config => loaders.require({ path: './config/default.js', mandatory: true })))
    .add('logger', Logger()).dependsOn({ component: 'config', source: 'logger', as: 'config' })
    .add('endpoints', Endpoints()).dependsOn({ component: 'config', source: 'endpoints', as: 'config' })
    .add('app', App())
    .add('router', Router()).dependsOn('app', 'endpoints', 'logger')
    .add('server', Server()).dependsOn('app', 'router', { component: 'config', source: 'server', as: 'config' })
