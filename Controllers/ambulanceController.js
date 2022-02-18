const Ambulance = require('../models/ambulance');
const  Position = require('../models/position');
const Stop = require('../models/stop');
const {Op}=require('sequelize');
const moment=require('moment');
const geocode=require('../services/geocoder')


const ambulanceController={
getAll:async function(req, res) {

    const TODAY_START = new Date().setHours(0, 1, 0, 0);
    var NOW = new Date();
    //NOW.setHours( NOW.getHours() + 1 );
    try{
      const ambulances=await Ambulance.findAll();
      //get device last positions:
      var lastpos=[]
      var Stops=[];
      for(var i=0;i<ambulances.length;i++){
      const LastPos=await Position.findOne({
          attributes:['AmbulanceId','lat','lng','Attributes','gpsTime'],
          where:{AmbulanceId:ambulances[i].id, },
          order: [['createdAt', 'DESC']],
        })
        if( LastPos ){
        const poswithName={...LastPos.dataValues,AmbulanceName:ambulances[i].name}
         lastpos.push(poswithName);
        }
       const ambulanceStop=await ambulances[i].getStops(
           {where:{
                createdAt: { 
                    [Op.gt]: TODAY_START,
                    [Op.lt]: NOW
                  },
           }});
       if(ambulanceStop.length > 0 ){
         /* var totalVac=0;
         for(var j=0;j<ambulanceStop.length;j++){
            totalVac+=ambulanceStop[j].vaccinated;
          } */   
        Stops.push({id:ambulances[i].id, stops: ambulanceStop,totalVaccinated:ambulances[i].vaccinCount}); 
       }
      }
      res.json({success: true, ambulances: ambulances,lastpos:lastpos, stops:Stops});
    }
    catch{
          res.json({success: false,msg:"error occuried"});
        }
        //here  we need to filter the devices according the user Role and return the value, meanwhile we just return every device  
},
getAllbyDay:async function(req, res) {
    const {day}=req.body;
    const DayTime=new Date(day);
    const DayTimePlusOne = new Date(moment(DayTime, "DD-MM-YYYY").add(1, 'days'));
   
    console.log("days: "+DayTime+ " next: "+DayTimePlusOne )
    try{
      const ambulances=await Ambulance.findAll();
      //get device last positions:
      var lastpos=[]
      var Stops=[];
      for(var i=0;i<ambulances.length;i++){
      const LastPos=await Position.findOne({
          attributes:['AmbulanceId','lat','lng','Attributes','gpsTime'],
          where:{
              AmbulanceId:ambulances[i].id,
              gpsTimeFixed: { [Op.between]:[DayTime,DayTimePlusOne]} 
         },
          order: [['createdAt', 'DESC']],
        })
        if( LastPos ){
         const poswithName={...LastPos.dataValues,AmbulanceName:ambulances[i].name}
         lastpos.push(poswithName);
        }
       const ambulanceStop=await ambulances[i].getStops({
           where:{
            createdAt: { 
              [Op.gt]: TODAY_START,
              [Op.lt]: NOW
            },
            }});
       if(ambulanceStop.length > 0 ){
        Stops.push({id:ambulances[i].id, stops: ambulanceStop}); 
       }
      }
      res.json({success: true, ambulances: ambulances,lastpos:lastpos, stops:Stops});
    }
    catch(err){
          res.json({success: false,msg:"error occuried",err});
        }
        //here  we need to filter the devices according the user Role and return the value, meanwhile we just return every device  
},

getbyId:async(req,res)=>{
const id = req.query.id;
const TODAY_START = new Date().setHours(0, 1, 0, 0);
var NOW = new Date();
//NOW.setHours( NOW.getHours() + 1 );
const ambulance = await Ambulance.findOne({ where: { id: id } });
if(ambulance){
    //get last pos :
    const LastPos=await Position.findOne({
        attributes:['AmbulanceId','lat','lng','Attributes','gpsTime'],
        where:{
            AmbulanceId:ambulance.id, 
       },
        order: [['createdAt', 'DESC']],
      });
      const address=await geocode(LastPos.lat,LastPos.lng);
      //get Stops of ambulance:
      const rawStops=await ambulance.getStops(
        {where:{
             createdAt: { 
                 [Op.gt]: TODAY_START,
                 [Op.lt]: NOW
               },
        }});
        var Stops=[];
        var duplicates=[];
        // get time difference :
      for(var i=0;i<rawStops.length;i++){ 
        var vacc =  rawStops[i].vaccinated;
        var startDate = rawStops[i].createdAt;
        if(vacc==0){
        startDate = new Date(startDate.setMinutes(startDate.getMinutes() - 20));
        }
        var diffMs = new Date(rawStops[i].updatedAt) - startDate;
        var endDate = new Date(rawStops[i].updatedAt);
        var diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
        var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
        var diffTimeLocal = diffHrs+"h "+diffMins+"min"
        var diffTimeHours = diffHrs + (diffMins/60)
        //var Stopelement={adress:rawStops[i].address,time:diffTimeLocal,vaccinated:rawStops[i].vaccinated}
        for(var j=i;j<rawStops.length;j++){
             if(rawStops[i].address==rawStops[j].address && i!=j){
                   duplicates.push(rawStops[j].id);
                   vacc += rawStops[j].vaccinated;
                   diffMs += new Date(rawStops[j].updatedAt)- new Date(rawStops[j].createdAt) ;
                   endDate = new Date(rawStops[j].updatedAt)
                   diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
                   diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
                   diffTimeLocal = diffHrs+"h "+diffMins+"min"
                   diffTimeHours = diffHrs + (diffMins/60)
             }
        }
        if(duplicates.includes(rawStops[i].id)==false){
          if( diffTimeHours == 0 && vacc > 0){
               var correctedTime = (vacc*1.5)/60
               startDate  =new Date(startDate.setMinutes(startDate.getMinutes() - correctedTime ));
               diffTimeHours = correctedTime
          }
        Stops.push({adress:rawStops[i].address,timeInhours:diffTimeHours,time:diffTimeLocal,vaccinated:vacc, startDate:startDate,endDate:endDate});
      }}
    
      
    res.json({ambulance:ambulance,TotalVaccinGlobal:ambulance.vaccinCountTotal,TotalVaccin:ambulance.vaccinCount,lastpos:{...LastPos.dataValues,address:address},stops:Stops})
}

},
create:async (req,res)=>{
   
    const {name,imei}=req.body;
    const newAmbulance = {name:name,imei:imei} 
    
    try
    {
    const newdevice=await Ambulance.create(newDevice);
    res.json({success:true,msg:"created",ambulanceId:newdevice.id})
     }
    catch(err)
    {
        console.log(err);res.json({success:false,msg:"failed"})
    }
},
edit:(req,res)=>{
    const {ambulanceId,name,imei}=req.body
    Ambulance.findAll({ where: {id:ambulanceId}}).then((ambulance)=>{
        if (ambulance.length == 1)
         {
             const newValues={name:name,imei:imei}
             Ambulance.update(newValues,{where:{id: ambulance[0].id}})
             .then(()=>{res.json({success: true,ambulanceId:ambulanceId})})
             .catch(()=>{res.json({success: false, msg: 'There was an error. Please contract the administator'});})
              
         }
        else
            {
              res.json({success: false});
            }
      })
    },
    delete:(req,res)=>{
        const {ambulanceId}=req.body
        Ambulance.findAll({ where: {id:ambulanceId}}).then((ambulance)=>{
            if(ambulance.length == 1)
            {
               Ambulance.destroy({where:{id: ambulance[0].id}})
               .then(()=>{ res.json({success: true,msg:"ambulance deleted succesfully",ambulanceId:ambulanceId});})
               .catch(()=>{res.json({success: false, msg: 'There was an error. Please contract the administator'});})
            }
            else{
                res.json({success: false});
            }
        })
    }
}
module.exports=ambulanceController