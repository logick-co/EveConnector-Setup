var nodejs = false;
try {
    if ( window !== this )
        nodejs = true;
} catch (e) {
    nodejs = true;
}

var Workflows = {}
Workflows.receiver = {
    'waiting-transfert':  {
        enq: ['Transfert accepted', 'ack', 'waiting-message'],
        nak: ['Transfert refused', 'nak', 'waiting-transfert']
    },
    'waiting-message':    {
        stx: ['Message recieved', null, 'validating-message'],
        eot: ['Transfert closed', null, 'waiting-transfert']
    },
    'validating-message': {
        ack: ['Message accepted', 'ack', 'stopping-transfert'],
        nak: ['Message refused', 'nak', 'waiting-message']
    },
    'stopping-transfert': {
        eot: ['Transfert terminated', null, 'waiting-transfert']
    }
}
Workflows.sender = {
    'waiting-start':     {
        null: ['Opening Transfert', 'enq', 'waiting-transfert']
    },
    'waiting-transfert': {
        ack: ['Sending message', 'stx', 'waiting-reception'],
        nak: ['Transfert refused', 'eot', 'waiting-start']
    },
    'waiting-reception': {
        ack: ['Message accepted, terminating', 'eot', 'waiting-start'],
        nak: ['Message refused, terminating', 'eot', 'waiting-start']
    }
}

if ( nodejs )
{
    exports.getWorkflows = function(){ return Workflows; }
}
