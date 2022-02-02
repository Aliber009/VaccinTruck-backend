const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const cors=require('cors')
const Position=require('./models/position')
const io = require('socket.io')(server, {
    cors: {
      origin: '*',
    }
  });
// Connect to pstgres
const sequelize=require('./config/sequelize');
const {Op}=require('sequelize')
const Sequelize =require('sequelize')
const geocode = require('./services/geocoder')
const eventEmitter=require('./config/rabbit');
const Ambulance = require('./models/ambulance');
const Stop = require('./models/stop');
    
app.use(cors());
app.use(express.json())
app.get('/', (req, res) => {
  res.send("Helolo");
});

//Const Add One and Unique Stop in a given position with a radius Tolerance in a period of time in 1 day
// Check the stop function 


const checkStop = async (ambulance,latNow,lonNow)=>{
  const TODAY_START = new Date().setHours(0, 0, 0, 0);
  const NOW = new Date();  
  var addStop=true
  try{
    const pos = await Position.findOne({
       attributes: ['lat' , 'lon'] ,
       where:{
       [Op.and]:[ 
       {AmbulanceId:ambulance.id},
       { gpsTimeFixed: {
          [Op.lte]: Sequelize.literal("NOW() - (INTERVAL '20 MINUTE')"),}
        },
       ]
     },
     order: [['createdAt', 'ASC']],
    });
    if(pos)
    {
      if(Math.abs(pos.lat-latNow)<0.0002 && Math.abs(pos.lon-lonNow)<0.0002 ){
        const AmbulanceStopsToday = await ambulance.getStops({where: {
          createdAt: { 
            [Op.gt]: TODAY_START,
            [Op.lt]: NOW
          },
        }});
        for(var i=0;i<AmbulanceStopsToday.length;i++){
          if(Math.abs(AmbulanceStopsToday[i].lat-pos.lat)<0.0002 && Math.abs(AmbulanceStopsToday[i].lon-pos.lon)<0.0002)
          {
            addStop=false
          }
        }
        
      }
    }
  }
  catch(err){
    console.log("error in stop finder",err)
  }  
  return addStop
}




 
//Data should be stored in Db even the user is not connected but only updated if they're connected


     
     //consuming 
     eventEmitter.on("mqChannel", (channel)=>{
      channel.prefetch(1)
      channel.consume("http-queue", async (msg) => {
         const jsonmsg=JSON.parse(msg.content.toString())
         const ambulance=await Ambulance.findOne({where:{imei:jsonmsg.serial}})
        if(ambulance){
        //Here we are sending the positions only 
        const gpsTime = new Date(jsonmsg.time*1000).toISOString();
        const gpsTimeFixed = new Date(jsonmsg.time*1000);
        const queries = {
          lat:jsonmsg.lat,
          lon:jsonmsg.lng,
          AmbulanceId:ambulance.id,
          gpsTime:gpsTime,
          gpsTimeFixed:gpsTimeFixed,
          Attributes:JSON.stringify({odometre:jsonmsg.odometer , battery:jsonmsg.bat_level ,temperature:jsonmsg.coolant_temp  ,speed:jsonmsg.vehicle_speed,imei:jsonmsg.serial })
        } 
        const pos=await Position.create(queries) ;
        //send pos and additional data only if the user has it
         io.emit('positionUpdate',pos);
        //Here we are sending the Stop Mark! by checking the stop first 
        
        if(checkStop(ambulance,jsonmsg.lat,jsonmsg.lng)==true){
         const Stopquery={
          lat:jsonmsg.lat,
          lon:jsonmsg.lng, 
          AmbulanceId:ambulance.id,
          vaccinated:0,
          address:await geocode(jsonmsg.lat,jsonmsg.lng) ,
         }
         console.log("new Stop, ",Stopquery)
         const newStop = await Stop.create(Stopquery);
         io.emit('stopUpdate',newStop);
        }
      }
      
        setTimeout(function() {
          console.log(" [x] Done");
          channel.ack(msg);
        }, 500);
    }, {
    noAck: false
  });
 }); 
 
app.use('/socket/positions',require('./routes/positions'));
app.use('/socket/ambulances',require('./routes/ambulances'));
app.use('/socket/stops',require('./routes/stops'));

server.listen(5000, () => {
  console.log('listening on *:5000');
});