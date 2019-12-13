var physical = require('./physical-layer.class.js').getPhysicalLayer();

physical.createClient('ws://localhost:8001/', 'physical');

console.log('Physical client created');
