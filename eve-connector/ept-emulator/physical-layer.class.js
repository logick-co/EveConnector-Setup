var nodejs = false;
try {
    if ( window !== this )
        nodejs = true;
} catch (e) {
    nodejs = true;
}

if ( nodejs )
{
    var http                = require("http");
    var ProtocolHelpers     = require('./protocol-helpers.class.js').getProtocolHelpers();
    var Workflows           = require('./workflows.class.js').getWorkflows();
}

/**
 * This PhysicalLayer object can be extended for "stx"
 * processing using PhysicalLayer.on([event], [callback]);
 *
 * The argument given to the callback function is "mixed" data...
 *
 **/

var PhysicalLayer = {
    prompt: nodejs ? require('prompt').start() : Prompt,
    on: function(event, callback){
        if ( PhysicalLayer._events[event] === undefined )
            PhysicalLayer._events[event] = [];
        if ( typeof(callback) == 'function' )
            PhysicalLayer._events[event].push(callback);
        return PhysicalLayer;
    },
    _events: {
        creation: [function(){
        }],
        serverConnection: [function(socket){
            console.log("New connection");
            PhysicalLayer.prepareTransmission();
        }],
        connectError: [function(error){
            console.error('CONNECTION ERROR to the ept-emulator', error);
        }],
        clientConnection: [function(socket){
            console.log("Connected");
            PhysicalLayer.prepareTransmission();
        }],
        dataReceived: [function(data){
            console.log('Got:', ProtocolHelpers.Physical.decode(data[0]), data);
        }],
        changingMode: [function(mode){
            console.log('Going into ', mode, 'mode');
        }],
        beforeAction: [function(infos){
            console.log('The current state before anything is', infos.state, infos.mode);
        }],
        close: [function(infos){
            // infos.code
            console.log("Connection closed:", infos.reason);
        }],
        changingSenderState: [function(infos){
            console.log('Sending state after', infos[0], 'is', infos[1]);
        }],
        changingReceiverState: [function(infos){
            console.log('Receiving state after', infos[0], 'is', infos[1]);
        }],
        changingState: [function(infos){
        }],
        receivingRawData: [function(data){
            console.log('Received:', data, '(raw)');
        }],
        sendingRawData: [function(data){
            console.log('Sent:', data, '(raw)');
        }],
        sendingData: [function(physical){
            console.log('Sent:', physical);
        }],
        sendingNothing: [function(what){
            console.log('Internal routing:', what);
        }],
        stxReceiving: [function(message){
            console.error('Receiving a message...', message);
        }],
        stxReceived: [function(message){
            console.info('');
            console.info('---- physical --------------');
            console.info(' ',message);
            console.info('----------------------------');
        }],
        stxReceivingError: [function(){
        }],
        stxSent: [function(message){
            console.info('');
            console.info('---- physical --------------');
            console.info(' "'+message+'"');
            console.info('----------------------------');
        }],
        stxBeforeSending: [function(infos){
            console.log('Sending:', infos.state, infos.message, infos.frame);
        }],
        stxSendingError: [function(message){
        }],
        reset: [function(){
            PhysicalLayer.prepareTransmission();
        }],
        stxReceivedLengthControl: [function(){
            return true;
        }],
        send: [function(data){
            PhysicalLayer.socket.emit('serial', data);
        }]
    },
    
    createServer: function(handler){
        var Express = require('express');
        var express = Express();
        var server = http.createServer(express);
        express.use('/', Express.static(__dirname + '/'));
        var io = require('socket.io')(server);
        io.on('connection', function(socket){
            PhysicalLayer.socket = socket;
            socket.on('disconnect', PhysicalLayer.events.close);
            socket.on('serial', PhysicalLayer.events.binary);
            PhysicalLayer._call('serverConnection', socket);
        });
        return server;
    },
    
    createClient: function(url){
        PhysicalLayer.socket = nodejs ? require('socket.io-client')(url) : io(url);
        PhysicalLayer.socket.on('connect', function(){
            PhysicalLayer._call('clientConnection', PhysicalLayer.socket);
        });
        PhysicalLayer.socket.on('connect_error', function(error){
            PhysicalLayer._call('connectError', error);
        });
        PhysicalLayer.socket.on('disconnect', PhysicalLayer.events.close);
        PhysicalLayer.socket.on('serial', PhysicalLayer.events.binary);
        return PhysicalLayer.socket;
    },
    
    clear: function(events){
        if ( events === undefined )
            events = [];
        if ( typeof(events) != 'object' )
            return PhysicalLayer;
        if ( events.length === undefined )
            events = [events];
        
        // clear everything
        if ( events.length == 0 || events.length == 1 && events[0] === null )
        {
            PhysicalLayer._events = {};
            return PhysicalLayer;
        }
        
        // clear some events
        for ( var i = 0 ; i < events.length ; i++ )
        if ( PhysicalLayer._events[events[i]] !== undefined )
            PhysicalLayer._events[events[i]] = [];
        return PhysicalLayer;
    },
    _call: function(event, mixed){
        var r = true;
        if ( PhysicalLayer._events[event] !== undefined )
        for ( var i = 0 ; i < PhysicalLayer._events[event].length ; i++ )
            r = PhysicalLayer._events[event][i](mixed) && r;
        return r;
    }
}

PhysicalLayer.events = {
    binary: function(data) {
        PhysicalLayer._call('receivingRawData', data);
        readStream(data, function(bin, msg){
            PhysicalLayer._call('dataReceived', [bin, msg]);
            
            // a strange exception
            if ( ProtocolHelpers.Physical.decode(bin) === undefined
              && ProtocolHelpers.Physical.decode(bin[0]) !== undefined )
                bin = bin[0];
            
            // errors
            if ( ProtocolHelpers.Physical.decode(bin) == undefined
             || mode && Workflows[mode][state[mode]][ProtocolHelpers.Physical.decode(bin)] == undefined )
            {
                sendBackError(bin);
                return;
            }
            
            // choosing the current mode if needed
            if ( !mode )
            {
                if ( Workflows.receiver[state.receiver][ProtocolHelpers.Physical.decode(bin)] != undefined )
                    mode = 'receiver';
                if ( Workflows.sender[state.sender][ProtocolHelpers.Physical.decode(bin)] != undefined )
                    mode = 'sender';
                PhysicalLayer._call('changingMode', mode);
                if ( !mode )
                {
                    sendBackError(bin);
                    return;
                }
            }
            
            PhysicalLayer._call('beforeAction', [state[mode], mode]);
            
            switch ( mode ){
            case 'sender':
                receiveInSenderMode(bin, msg);
                break;
            default:
                receiveInReceiverMode(bin, msg);
                break;
            }
        });
    },
    
    close: function (code, reason) {
        PhysicalLayer._call('close', [code, reason]);
    }
}

// internal stuff

    var state = { receiver: 'waiting-transfert', sender: 'waiting-start' };
    var mode  = null;
    
    
    // receiver
    var receiveInReceiverMode = function(bin, msg){
        if ( ProtocolHelpers.Physical.decode(bin) === undefined  )
        {
            // unknown input
            send('nak');
            return;
        }
        
        send(Workflows.receiver[state.receiver][ProtocolHelpers.Physical.decode(bin)]);
        
        // everything but a message
        if ( ProtocolHelpers.Physical.decode(bin) != 'stx' )
            return;
        
        PhysicalLayer._call('stxReceiving', msg);
        
        // receiving a message...
        if ( msg === undefined || msg === null ) // ERROR
        {
            PhysicalLayer._call('stxReceivingError', 'no message'); // hook
            send(Workflows.receiver[state.receiver]['nak']);
            return;
        }
        
        if ( !PhysicalLayer._call('stxReceivedLengthControl', msg) )
        {
            PhysicalLayer._call('stxReceivingError', 'message length is incorrect ('+msg.length+')'); // hook
            send(Workflows.receiver[state.receiver]['nak']);
            return;
        }
        
        PhysicalLayer._call('stxReceived', msg); // hook
        send(Workflows.receiver[state.receiver]['ack']);
    }
    
    // sender
    var message = null;
    PhysicalLayer.prepareTransmission = function(questions, lengthCriterias, preanswers){
        if ( questions === undefined )
            questions = 'message';
        
        // answers
        PhysicalLayer.prompt.get(questions, function(err, result){
            if ( err )
            {
                console.error('Error reading stdin', err);
                return;
            }
            
            for ( question in preanswers )
            if ( preanswers[question] !== undefined )
                result[question] = preanswers[question];
            
            if ( result.message )
                message = result.message;
            else
            {
                message = '';
                if ( lengthCriterias !== undefined )
                {
                    for ( var question in lengthCriterias )
                    if ( result[question] !== undefined )
                    {
                        var pad = '';
                        var length = typeof(lengthCriterias[question]) == 'object' ? lengthCriterias[question].length : lengthCriterias[question];
                        var padc = typeof(lengthCriterias[question]) == 'object' ? lengthCriterias[question].pad : '0';
                        for ( var i = 0 ; i < length ; i++ )
                            pad += padc;
                        message += pad.substring(result[question].length);
                        message += result[question].substring(0,length);
                    }
                }
                else
                for ( var question in questions )
                if ( result[question] !== undefined )
                    message += result[question];
            }
            
            var loops = 0;
            mode = 'sender';
            send(Workflows.sender[state.sender][null]); // opens a new transfert
        });
    }
    
    var receiveInSenderMode = function(bin, msg){
        // sender
        if ( Workflows.sender[state.sender][ProtocolHelpers.Physical.decode(bin)] === undefined )
        {
            resetMode();
            send('nak');
            return;
        }
        
        if ( Workflows.sender[state.sender][ProtocolHelpers.Physical.decode(bin)] == 'nak' )
        {
            if ( Workflows.sender[state.sender][ProtocolHelpers.Physical.decode(bin)] === undefined )
            {
                resetMode();
                return;
            }
            
            if ( state.sender == 'waiting-reception' )
                PhysicalLayer._call('stxSendingError', message); // hook
            changeState.sender(Workflows.sender[state.sender][ProtocolHelpers.Physical.decode(bin)][2]);
            return;
        }
        
        send(Workflows.sender[state.sender][ProtocolHelpers.Physical.decode(bin)]);
    }
    
    // generic
    var sendBackError = function(bin){ send('nak'); }
    
    var changeState = {
        sender: function(newState){
            PhysicalLayer._call('changingSenderState', [state.sender, newState]);
            state.sender = newState;
            if ( Workflows.sender[state.sender][1] )
                send(ProtocolHelpers.Physical.encode(Workflows.sender[state.sender][1]));
        },
        receiver: function(newState){
            PhysicalLayer._call('changingReceiverState', [state.sender, newState]);
            state.receiver = newState;
            if ( Workflows.receiver[state.receiver][null] !== undefined )
            {
                send(Workflows.receiver[state.receiver][null]);
                if ( state.receiver != 'waiting-start' )
                    readResponse();
            }
        }
    }
    
    var send = PhysicalLayer.send = function(action, rawState){
        // the data, raw
        if ( typeof(action) != 'object' )
        {
            if ( action !== null )
            {
                PhysicalLayer._call('send', ProtocolHelpers.Physical.encode(action));
                PhysicalLayer._call('sendingRawData', action);
            }
            if ( rawState !== undefined )
                changeState[mode](rawState);
            if ( action == 'eot' )
                resetMode();
            return;
        }
        
        var nextMode = mode;
        if ( action[1] )
        switch ( action[1] ) {
        case 'stx':
            var tmp = ProtocolHelpers.Physical.getFrame(message);
            PhysicalLayer._call('stxBeforeSending', { state: action[0], message: message, frame: tmp }); // hook
            PhysicalLayer._call('send', tmp); // hook
            PhysicalLayer._call('stxSent', message); // hook
            break;
        case 'eot':
            nextMode = null;
        default:
            // the data, forged
            PhysicalLayer._call('send', ProtocolHelpers.Physical.encode(action[1])); // hook
            PhysicalLayer._call('sendingData', action[0]);
            break;
        }
        else
            PhysicalLayer._call('sendingNothing', action[0]);
        
        // the state
        changeState[mode](action[2]);
        nextMode == null ? resetMode() : mode = nextMode;
    }
    
    var resetMode = function(){
        PhysicalLayer._call('reset', mode);
        mode = null;
    }
    
    // low level
    var readStream = function(data, callback){
        // for the single char communication
        if ( data.length == 1 )
        {
            callback(data);
            return;
        }
        
        var msg = null;
        try {
            msg = ProtocolHelpers.Physical.getMessage(data);
        } catch (e) {
            console.error('Error when uncrypting the STX frame:', e);
        }
        callback(data[0], msg);
    }

if ( nodejs )
    exports.getPhysicalLayer = function(){ return PhysicalLayer; }
