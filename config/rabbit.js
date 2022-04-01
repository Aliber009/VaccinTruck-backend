//event emmiter
const EventEmitter = require('events')
const eventEmitter = new EventEmitter()
//connect to rabbit
var amqp = require('amqplib/callback_api');

const connection = amqp.connect('', function(error0, connection) {
  if (error0) {
    throw error0;
  }
  console.log("Rabbit connected")
  connection.createChannel(function(error1, channel) {
    if (error1) {
      throw error1;
    }
    
    eventEmitter.emit('mqChannel',channel)  
  });
});

module.exports = eventEmitter
