import { Request, Response } from "express";
var express = require('express');
var router = express.Router();
import * as request from 'request';
import * as config from 'config';
import { getServiceAddress } from 'system-endpoints'

router.use((req, res, next) => {
  let cart = (<any>req).cookies['fs_cart']
  if (!cart) cart = { created: new Date(), items: [] }
  req.cart = cart
  next()
})

router.get('/summary', function (req, res, next) {
  getFlowersById(req.cart.items, (err, flowers) => {
    if (err) return res.sendStatus(500)
    let data = {
      cartValue: (flowers.reduce((a, b) => a + (b ? b.Price : 0), 0)).toFixed(2),
      cartItems: flowers,
      registrationUrl: `http://${getServiceAddress('localhost:3007')}/registration`
    }
    res.render('summary', data)
  })
})

router.post('/checkout', function (req, res, next) {
  console.log(req.cart.items)
  request.post(
    {
      url: `http://${getServiceAddress(config.get<string>("dataApi"))}/data/order`,
      form: {
        customerName: req.body.customerName,
        customerAddress: req.body.customerAddress,
        emailAddress: req.body.emailAddress,
        flowers: JSON.stringify(req.cart.items)
      }
    },
    (err, orderRes, flower) => {
      if (err) return res.sendStatus(500)
      if (orderRes.statusCode !== 201) res.sendStatus(orderRes.statusCode)
      res.cookie('fs_cart', '').redirect('/')
    })
})

router.get('/checkout', function (req, res, next) {
  getFlowersById(req.cart.items, (err, flowers) => {
    if (err) return res.sendStatus(500)
    let data = {
      cartValue: (flowers.reduce((a, b) => a + (b ? b.Price : 0), 0)).toFixed(2),
      cartItems: flowers
    }
    res.render('checkout', data)
  })
})



router.get('/add/:id', (req, res, next) => {
  console.log('add cart', req.cart)
  getFlowersById([req.params['id']], (err, flowers) => {
    if (err) return res.setStatus(500)
    req.cart.items.push(flowers[0]._id)
    res.cookie('fs_cart', req.cart).redirect('/')
  })
})

function getFlowersById(ids: Array<string>, clb: Function) {
  let p = ids.map(flowerId => new Promise((resolv, reject) => {
    request.get({ url: `http://${getServiceAddress(config.get<string>("dataApi"))}/data/flower(${flowerId})`, timeout: 4000 },
      (err, catRes, flower) => {
        if (err) reject(err)
        resolv(JSON.parse(flower))
      })
  }))
  Promise.all(p)
    .then((flowers) => { clb(null, flowers) })
    .catch((err) => { clb(err) })
}

module.exports = router;
