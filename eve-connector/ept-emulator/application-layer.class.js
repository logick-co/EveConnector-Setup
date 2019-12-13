var nodejs = false;
try {
  if ( window !== this )
    nodejs = true;
} catch (e) {
  nodejs = true;
}

var ApplicationLayer = function(interactive, pos, currency, mod, type, ind) {
    var application = this;
    this.interactive = interactive;
    this.pos      = pos !== undefined       ? pos+''      : pos;
    this.currency = currency !== undefined  ? currency+'' : currency;
    this.mode     = mod !== undefined       ? mod+''      : mod;
    this.type     = type !== undefined      ? type+''     : type;
    this.ind      = ind !== undefined       ? ind+''      : ind;
    
    this.logical = nodejs ? require('./logical-layer.class.js').createLogicalLayer() : new LogicalLayer();
    
    this.createServer = function(){
        return this.logical.createServer();
    }
    this.createClient = function(url){
        return this.logical.createClient(url);
    }
    
    this.prepareTransaction = function(amount, private){
        preanswers = {
            pos: this.pos,
            currency: this.currency,
            mode: this.mode,
            type: this.type,
            ind: this.ind,
            amount: amount !== undefined ? amount+'' : amount,
            private: private !== undefined ? private+'' : private,
        }
        
        questions = [];
        for ( var question in this.logical.messageStructure[this.logical.ept] )
        if ( preanswers[question] === undefined )
            questions.push(question);
        
        this.logical.physical.prepareTransmission(questions, this.logical.messageStructure[this.logical.ept], preanswers);
    }

    application.logical.physical
        .clear([
            'clientConnection'
        ])
        
        .on('clientConnection', function(conn){
            console.log("Application connected");
            if ( application.interactive )
                application.prepareTransaction();
        })
        
        .on('stxReceived', function(message){
            var result = application.logical.processResponse(message);
            
            application.logical.physical._call(result.stat == '0' ? 'applicationSuccess' : 'applicationFailure', result);

            if ( application.interactive )
                application.prepareTransaction();
        })
        
        .on('applicationSuccess', function(result){
            console.info('---- application -----------');
            console.info('  Success :)');
            console.info('  Result:', result);
            console.info('----------------------------');
            
        })
        .on('applicationFailure', function(result){
            console.info('---- application -----------');
            console.info('  !! Failed !!');
            console.info('  Result:', result);
            console.info('----------------------------');
            
        })
    ;
}

if ( nodejs )
exports.createApplicationLayer = function(interactive, pos, currency, mod, type, ind){
    return new ApplicationLayer(interactive, pos, currency, mod, type, ind);
}
