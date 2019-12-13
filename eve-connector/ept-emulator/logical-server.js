var fs = require('fs');

var physical = require('./logical-layer.class.js')
    .createLogicalLayer()
    .createServer(function(req, res){
      console.error(req, res);
      fs.readFile(__dirname + '/index.html',
      function (err, data) {
        if (err) {
          res.writeHead(500);
          return res.end('Error loading index.html');
        }

        res.writeHead(200);
        res.end(data);
      });
    })
    .listen('8001');

console.log('');
console.log('+---------------------------------------------------------------+');
console.log('|                         EPT emulator                          |');
console.log('|      Concert Protocole, aka "Protocole Caisse" in french.     |');
console.log('| © 2016 Libre Informatique [http://www.libre-informatique.fr/] |');
console.log('+---------------------------------------------------------------+');
console.log('');
console.log('Emulated EPT: iCT250, iWL220');
console.log('');
console.log('Visit http://localhost:8001/ to test the EPT emulator using a web browser');
console.log('Launch `node application-client.console.js` to test the EPT emulator using the command line');
console.log('');
console.log('');
console.log('Logical server created');
