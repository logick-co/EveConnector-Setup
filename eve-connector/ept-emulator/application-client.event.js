var application = require('./application-layer.class.js')
    .createApplicationLayer(false, 'B8', 978, 1, 0, 0);
application.createClient('ws://localhost:8001/');

console.log('Application client created');

setTimeout(function(){
    application.prepareTransaction(2690, 789789);
},1500);
