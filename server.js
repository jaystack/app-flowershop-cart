const pkg = require('./package.json');
const app = require('./lib/app/index').default;

app.start()
console.log('asdasdasd')
process.on('unhandledRejection', err => console.error(err))