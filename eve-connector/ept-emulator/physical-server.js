var physical = require('./physical-layer.class.js').getPhysicalLayer();

physical
    .createServer()
    .listen(8001);

console.log('Physical server created');
