// A trick to be able
var nodejs = false;
try {
    if ( window !== this )
        nodejs = true;
} catch (e) {
    nodejs = true;
}

if ( nodejs )
    exports.getLogicalLayer = function(){ return require('./logical-layer.class.js').getLogicalLayer(); }
