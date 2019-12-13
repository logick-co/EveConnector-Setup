var fs = require('fs');
var https_options = {
    key: fs.readFileSync(__dirname + '/../eve-connector/server.key'),
    cert: fs.readFileSync(__dirname + "/../eve-connector/server.crt")
}

//console.log(https_options);

var EC = require(__dirname + '/../eve-connector/eve-connector-server.js').createServer(8164, https_options);
