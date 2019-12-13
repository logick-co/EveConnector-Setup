var application = require('./application-layer.class.js')
    .createApplicationLayer(true, 'B8', 978, 1, 0, 0);
application.createClient('ws://localhost:8001/');

console.log('Application client created');
