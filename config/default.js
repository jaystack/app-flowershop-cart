const { transports } = require('winston')

module.exports = {
  "endpoints": {
    "endpointsFilePath": "system-endpoints.json",
    "normalize": false
  },
  "logger": {
    "transportFactories": [
      () => new transports.Console(),
      () => new transports.File({ filename: 'all.log' })
    ]
  },
}