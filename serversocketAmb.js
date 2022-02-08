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
  
  
/* const checkStop = async (ambulance,latNow,lonNow,EventVaccinCount)=>{
  const TODAY_START = new Date().setHours(0, 0, 0, 0);
  const NOW = new Date();  
  var addStop=true
  
  try{
    const pos = await Position.findOne({
       attributes: ['lat' , 'lng'] ,
       where:{ 
       AmbulanceId:ambulance.id},
     order: [['createdAt', 'DESC']],
    });
    const AmbulanceStopsToday = await ambulance.getStops({where: {
      createdAt: { 
        [Op.gt]: TODAY_START,
        [Op.lt]: NOW
      },
    }});
    if(pos)
    {
      
      //Check Stop by Time 
      if(Math.abs(pos.lat-latNow)<0.0002 || Math.abs(pos.lng-lonNow)<0.0002 ){
        
        for(var i=0;i<AmbulanceStopsToday.length;i++){
          if(Math.abs(AmbulanceStopsToday[i].lat-pos.lat)<0.002 || Math.abs(AmbulanceStopsToday[i].lng-pos.lng)<0.002)
          {
            addStop=false
          }
        }
        
      }
    }
    //Check Stop by Vaccinated Count : 
    if(ambulance.vaccinCount!=EventVaccinCount)
    {
      
      
      for(var i=0;i<AmbulanceStopsToday.length;i++){
        if(Math.abs(AmbulanceStopsToday[i].lat-pos.lat)<0.002 || Math.abs(AmbulanceStopsToday[i].lng-pos.lng)<0.002)
        {
          await AmbulanceStopsToday[i].increment('vaccinated',{by:EventVaccinCount-ambulance.vaccinCount});
          addStop=false;
          break;
        }
      }
      await ambulance.update({vaccinCount:EventVaccinCount});
    }
  if(addStop==true){
    const craeteStopwithCount = EventVaccinCount-ambulance.vaccinCount;
    const Stopquery={
      lat:latNow,
      lng:lonNow, 
      AmbulanceId:ambulance.id,
      vaccinated:craeteStopwithCount ,
      address:await geocode(latNow,lonNow) ,
     }
     console.log("new Stop, ",Stopquery)
     const newStop = await Stop.create(Stopquery);
     io.emit('stopUpdate',newStop);
  }
}
  catch(err){
  console.log("error in stop finder",err)
  }   
} */


//Optimized function to check Stop:
const checkStop = async (ambulance,latNow,lonNow,EventVaccinCount)=>{
  try{
  const TODAY_START = new Date().setHours(0, 0, 0, 0);
  const NOW = new Date();  
  var addStop=true
  //get all stops today
  const AmbulanceStopsToday = await ambulance.getStops({where: {
    createdAt: { 
      [Op.gt]: TODAY_START,
      [Op.lt]: NOW
    },
  }});
  //Check Stop by Vaccinated Count : 
 /*  if(ambulance.vaccinCount!=ambulance.vaccinCountTotal){
    //await ambulance.update({vaccinCountTotal:ambulance.vaccinCount });
  } */
  if(ambulance.vaccinCount<EventVaccinCount)
  {
    var StopExist=false;
    for(var i=0;i<AmbulanceStopsToday.length;i++){
      if(Math.abs(AmbulanceStopsToday[i].lat-latNow)<0.001 || Math.abs(AmbulanceStopsToday[i].lng-lonNow)<0.001)
      {
        console.log('increment!')
        await AmbulanceStopsToday[i].increment('vaccinated',{by:Math.abs(EventVaccinCount-ambulance.vaccinCount)});
        StopExist=true;
        break;
      }
    }
    if(StopExist==false)
    {
      const craeteStopwithCount = EventVaccinCount-ambulance.vaccinCount;
      const Stopquery={
      lat:latNow,
      lng:lonNow, 
      AmbulanceId:ambulance.id,
      vaccinated:craeteStopwithCount ,
      address:await geocode(latNow,lonNow) ,
     }
     console.log("new Stop by diff  ")
     const newStop = await Stop.create(Stopquery);
     io.emit('stopUpdate',newStop);
    }
    //update ambulance : 
    await ambulance.update({vaccinCount:EventVaccinCount,vaccinCountTotal:parseInt(ambulance.vaccinCountTotal)+(parseInt(EventVaccinCount)-parseInt(ambulance.vaccinCount))});
    return;
  }
  //counter reseted
   else if(ambulance.vaccinCount > EventVaccinCount){
    //update ambulance : 
    var addStopReset=true;
    const newresetCount = parseInt(EventVaccinCount) + parseInt(ambulance.vaccinCountTotal)
    await ambulance.update({vaccinCount: EventVaccinCount, vaccinCountTotal:newresetCount });
    for(var i=0;i<AmbulanceStopsToday.length;i++){
      if(Math.abs(AmbulanceStopsToday[i].lat-latNow)<0.001 || Math.abs(AmbulanceStopsToday[i].lng-lonNow)<0.001)
      {
        addStopReset=false;
      }
    }
    //create default stop for first data 
    if(addStopReset==true){
    const Stopquery={
      lat:latNow,
      lng:lonNow, 
      AmbulanceId:ambulance.id,
      vaccinated:EventVaccinCount ,
      address:await geocode(latNow,lonNow) ,
     };
     console.log('new Stop by reset!')
     const newStop = await Stop.create(Stopquery);
     io.emit('stopUpdate',newStop);
     return;
    }

    
  }
  else{
      var addStop=true; 
      const NOW = new Date();
      const Now_delay = new Date(NOW.setMinutes(NOW.getMinutes() - 5))
    //check Stop by time and position approx
      const pos = await Position.findAll({
      attributes: ['lat' , 'lng'] ,
      where:{ 
      AmbulanceId:ambulance.id,
      createdAt: {
        [Op.gt]: Now_delay ,
        [Op.lt]:new Date() ,
      }},
      order: [['createdAt', 'DESC']],
      });
      if(pos.length>0)
      { 
      for( var p=0 ;p<pos.length;p++){
        if(Math.abs(pos[p].lat-latNow)>0.001 || Math.abs(pos[p].lng-lonNow)>0.001 ){
          addStop=false;
          break;
        }  
      }
      }
      if(addStop==true){
        for(var i=0;i<AmbulanceStopsToday.length;i++){
          if(Math.abs(AmbulanceStopsToday[i].lat-latNow)<0.001 || Math.abs(AmbulanceStopsToday[i].lng-lonNow)<0.001)
          {
            addStop=false;
            break;
          }
        }
      }
      
        if( addStop == true){
          const Stopquery={
            lat:latNow,
            lng:lonNow, 
            AmbulanceId:ambulance.id,
            vaccinated:0 ,
            address:await geocode(latNow,lonNow) ,
           };
           console.log('new Stop by time!')
           const newStop = await Stop.create(Stopquery);
           io.emit('stopUpdate',newStop);
           return;
        }
      }
    }
 catch{
   console.log("error in stop finder")
 }
}



//consuming Rabbit Queue 
     eventEmitter.on("mqChannel", (channel)=>{
      channel.prefetch(1)
      channel.consume("ambu", async (msg) => {
        //get the message header 
         const serial = msg.properties.headers.serial
         const jsonmsg=JSON.parse(msg.content.toString())
         
         if(jsonmsg.gpsPayload.latitude && jsonmsg.gpsPayload.longitude ){
        const ambulance=await Ambulance.findOne({where:{imei:serial}})
        if(ambulance){
        //Here we are sending the positions only
        var queries = {} 
         const gpsTime = new Date().toISOString();
         const lastPositionInQueue = Position.findOne({where:{AmbulanceId:ambulance.id},order: [['createdAt', 'DESC']]});
        if(Math.abs(jsonmsg.gpsPayload.latitude-lastPositionInQueue.lat)<0.0002 || Math.abs(jsonmsg.gpsPayload.longitude-lastPositionInQueue.lng)<0.0002)
        {
        const gpsTimeFixed = new Date();
         queries = {
          lat:lastPositionInQueue.lat,
          lng:lastPositionInQueue.lon,
          AmbulanceId:ambulance.id,
          gpsTime:gpsTime,
          gpsTimeFixed:gpsTimeFixed,
          Attributes:JSON.stringify({deviceCount:jsonmsg.deviceCount , vaccinTemperature:jsonmsg.vac_temperature ,speed:jsonmsg.gpsPayload.speed })
        }
      }
      else{
        const gpsTimeFixed = new Date();
          queries = {
          lat:jsonmsg.gpsPayload.latitude,
          lng:jsonmsg.gpsPayload.longitude,
          AmbulanceId:ambulance.id,
          gpsTime:gpsTime,
          gpsTimeFixed:gpsTimeFixed,
          Attributes:JSON.stringify({deviceCount:jsonmsg.deviceCount , vaccinTemperature:jsonmsg.vac_temperature ,speed:jsonmsg.gpsPayload.speed })
        }
       } 
        const pos=await Position.create(queries) ;
        //send pos and additional data only if the user has it
         io.emit('positionUpdate',pos);
        //Here we are sending the Stop Mark! by checking the stop first 
       checkStop(ambulance,jsonmsg.gpsPayload.latitude,jsonmsg.gpsPayload.longitude,jsonmsg.vaccin_count)
         
      }
      else{
   const arrayData=[
     {name:"Oulad azzouz",serial:"124158189232209108",immatricule:"225356j"},
     {name:"Bouskoura",serial:"761717416365196",immatricule:"190162j"},
     {name:"Nouaceur",serial:"12415818925449220",immatricule:"219852j"},
     {name:"Oulad saleh",serial:"124158189232125208",immatricule:"211391j"},
     {name:"Dar bouazza",serial:"12415818923323344",immatricule:"219849j"},
      ];
      for(var k=0;k<arrayData.length;k++){
        if(serial==arrayData[k].serial){
         const ambu = await Ambulance.create({
           name:arrayData[k].name,
           imei:serial,
           immatricule:arrayData[k].immatricule,
           vaccinCount:jsonmsg.vaccin_count,
          });
         break;
        }
      }  
      }
    }
        setTimeout(function() {
          console.log(" [x] Done");
          channel.ack(msg);
        }, 50);
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