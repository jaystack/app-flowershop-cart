import cookieParser = require('cookie-parser')
import { static as expressStatic } from 'express'
import path = require('path')
import * as request from 'request'
import bodyParser = require('body-parser')
import express = require('express')
import morganLog = require('morgan')

export default function Router() {
  return {
    async start({app, endpoints, logger}) {
      app.set('views', path.join(process.cwd(), './views'))
      app.set('view engine', 'hbs')

      app.use(morganLog('dev'))
      app.use(bodyParser.json())
      app.use(bodyParser.urlencoded({ extended: false }))
      app.use(cookieParser())
      app.use(express.static(path.join(process.cwd(), './public')))

      const getFlowersById = ((ids: Array<string>, clb: Function) => {
        let p = ids.map(flowerId => new Promise((resolv, reject) => {
          request.get({ url: `http://${endpoints.getServiceAddress('localhost:3003')}/data/flower(${flowerId})`, timeout: 4000 },
            (err, catRes, flower) => {
              if (err) {logger.warn(err); return reject(err)}
              resolv(JSON.parse(flower))
            })
        }))
        Promise.all(p)
          .then((flowers) => { clb(null, flowers) })
          .catch((err) => { clb(err) })
      })

      const router = express.Router()

      router.use((req, res, next) => {
        let cart
        if (!!req.cookies && !!req.cookies["fs_cart"]) cart = (<any>req).cookies["fs_cart"]
        if (!cart) cart = { created: new Date(), items: [] }
        req['cart'] = cart
        next()
      })

      router.get('/summary', (req, res, next) => {
        getFlowersById(req['cart'].items, (err, flowers) => {
          if (err) { logger.warn(err); return res.sendStatus(500) }
          let data = (flowers.length > 0)
            ? {
              cartValue: (flowers.reduce((a, b) => a + (b ? b.Price : 0), 0)).toFixed(2),
              cartItems: flowers,
            }
            : { cartValue: 0, cartItems:[] }
          res.render('summary', data)
        })
      })

      router.post('/checkout', (req, res, next) => {
        request.post(
          {
            url: `http://${endpoints.getServiceAddress('localhost:3003')}/data/order`,
            form: {
              customerName: req.body.customerName,
              customerAddress: req.body.customerAddress,
              emailAddress: req.body.emailAddress,
              flowers: JSON.stringify(req['cart'].items)
            },
          },
          (err, orderRes, order) => {
            if (err) return res.sendStatus(500)
            if (orderRes.statusCode !== 201) res.status(orderRes.statusCode)
            res.cookie('fs_cart', '').redirect('/')
          })
      })

      router.get('/checkout', (req, res, next) => {
        getFlowersById(req['cart'].items, (err, flowers) => {
          if (err) return res.sendStatus(500)
          let data = (flowers.length > 0)
            ? {
              cartValue: (flowers.reduce((a, b) => a + (b ? b.Price : 0), 0)).toFixed(2),
              cartItems: flowers,
            }
            : { cartValue: 0, cartItems:[] }
          res.render('checkout', data)
        })
      })

      router.get('/add/:id', (req, res, next) => {
        getFlowersById([req.params['id']], (err, flowers) => {
          if (err) return res.sendStatus(500)
          req['cart'].items.push(flowers[0]._id)
          res.cookie('fs_cart', req['cart']).redirect('/')
        })
      })

      app.use('/cart/', router)
    }
  }
}