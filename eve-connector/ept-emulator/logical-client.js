var physical = require('./logical-layer.class.js')
    .createLogicalLayer()
    .createClient('ws://localhost:8001/');

console.log('Logical client created');
