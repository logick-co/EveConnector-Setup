var nodejs = false;
try {
    if ( window !== this )
        nodejs = true;
} catch (e) {
    nodejs = true;
}

var LogicalLayer = function() {
    var logical = this;
    this.ept = null;
    this.expectingRep = false;
    this.version = 'E';
    this.priv = '';
    this.rep = true;
    
    var messageStructure = this.messageStructure = {
        true: {
            pos: 2,
            stat: 1,
            amount: 8,
            mode: 1,
            rep: { pad: ' ', length: 55 },
            currency: 3,
            private: { pad: ' ', length: 10 }
        },
        false: {
            pos: 2,
            amount: 8,
            ind: 1,
            mode: 1,
            type: 1,
            currency: 3,
            private: { pad: ' ', length: 10 },
        }
    };
    
    this.createServer = function(handler){
        this.ept = true; // true is for the EPT
        
        return physical.createServer(handler);
    }
    this.createClient = function(url){
        this.ept = false; // false is for the POS
        
        if ( this.version == 'E+' )
        {
            messageStructure.pos.delai = 4; // 0xa01-
            messageStructure.pos.auto  = 4; // 0xb01-
        }
        
        return physical.createClient(url);
    }
    
    this.processResponse = function(message){
        var result = fromRawToStructuredData(message, messageStructure[!logical.ept]);
        // play with the options of the answer
        logical.rep = result.ind == 1;
        
        return result;
    }

    var physical = this.physical = nodejs ? require('./physical-layer.class.js').getPhysicalLayer() : PhysicalLayer;
    physical
        .clear([
            'dataReceived',
            'changingMode',
            'beforeAction',
            'changingSenderState',
            'changingReceiverState',
            'receivingRawData',
            'sendingRawData',
            'sendingData',
            'sendingNothing',
            'stxReceiving',
            'stxBeforeSending',
            'serverConnection',
            'clientConnection',
            'reset'
        ])
        
        .on('serverConnection', function(conn){
            console.log("New connection");
        })
        
        .on('clientConnection', function(conn){
            console.log("Connected");
            
            var questions = [];
            for ( var question in messageStructure[logical.ept] )
                questions.push(question);
            physical.prepareTransmission(questions, messageStructure[logical.ept]);
        })
        
        .on('stxReceived', function(message){
            var result = logical.processResponse(message);
            
            console.info('---- logical ---------------');
            for ( prop in result )
                console.info('          '.substring(prop.length)+prop.substring(0,10), result[prop]);
            console.info('----------------------------');
            
            var answers = {};
            if ( logical.ept && typeof(result) == 'object' )
            {
                var questions = ['pos', 'amount', 'mode', 'currency', 'private'];
                for ( var i = 0 ; i < questions.length ; i++ )
                if ( result[questions[i]] !== undefined )
                    answers[questions[i]] = result[questions[i]];
            }
            
            // for the answer
            var questions = [];
            for ( var question in messageStructure[logical.ept] )
            if (!( question == 'priv' && result.priv === undefined ) && !( question == 'rep' && !this.rep ))
            if ( answers[question] === undefined )
                questions.push(question);
            
            physical._call('stxProcessed', { questions: questions, structure: messageStructure[logical.ept], answers: answers });
        })
        
        // Message control function
        .on('stxProcessed', function(data){
            physical.prepareTransmission(data.questions, data.structure, data.answers);
        })
        
        // Message control function
        .on('stxReceivedLengthControl', function(message){
            switch ( logical.ept ){
            case false: // POS
                if ( message.length != 25    // E or E+
                  && message.length != 80    // E or E+ with REP
                )
                    return false;
                
                logical.rep = message.length == 80;
                break;
            case true: // EPT
                if ( message.length != 26   // E
                  && message.length != 34 ) // E+
                    return false;
                break;
            }
            
            // if we finish here, we are ok
            return true;
        })
        
        .on('stxReceivingError', function(err){
            console.error('stxReceivingError /!\\', err);
        })
        
        .on('reset', function(mode){
            console.log('Resetting things...');
            if ( mode == 'sender' )
                return;
            
            // for the answer
            var questions = [];
            for ( var question in messageStructure[logical.ept] )
            if (!( question == 'priv' && result.priv === undefined ))
                questions.push(question);
            physical.prepareTransmission(questions, messageStructure[logical.ept]);
        })
        
        .on('stxSent', function(message){
            var result = fromRawToStructuredData(message, messageStructure[logical.ept]);
            
            if ( logical.ept == 'pos' && result.ind == '1' ) // needs a REP field at the end in the response
                logical.expectingRep = true;
            
            console.info('---- logical ---------------');
            for ( prop in result )
                console.info('          '.substring(prop.length)+prop.substring(0,10), result[prop]);
            console.info('----------------------------');
        })
        
        .on('stxSendingError', function(message){
            console.error('stxSendingError /!\\', message);
        })
    ;
    
    var fromRawToStructuredData = function(raw, structure){
        var i = 0;
        result = {};
        for ( var prop in structure )
        if (!( prop == 'rep' && !this.rep ))
        {
            var length = typeof(structure[prop]) == 'object'
                ? structure[prop].length
                : structure[prop];
            
            result[prop] = raw.slice(i,i+length);
            i += length;
        }
        return result;
    }
    
}

if ( nodejs )
    exports.createLogicalLayer = function(){ return new LogicalLayer(); }
