const pkg = require('./package.json');
const app = require('./lib/app/index').default;

app.start()

process.on('unhandledRejection', err => console.error(err))