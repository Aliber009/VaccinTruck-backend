const Stop = require('../models/stop');
const {Op, Sequelize}=require('sequelize');
const Position = require('../models/position');
const moment=require('moment');



const stopController = {
   getStops:async (req,res)=>{
      try{
        const TODAY_START = new Date().setHours(0, 1, 0, 0);
        var NOW = new Date();
        //NOW.setHours( NOW.getHours() + 1 );
        var totalVac=0;
        console.log('today,'+TODAY_START+"now: "+NOW)
        /* const DayTime=new Date();
        const DayTimePlusOne = new Date(moment(DayTime, "DD-MM-YYYY").add(-1, 'days')); */
        //console.log("days: "+DayTime+ " next: "+DayTimePlusOne )
        const Stops = await Stop.findAll({where:{
          createdAt: { [Op.between]:[TODAY_START,NOW]} 
          }});
          //get total vaccinated:
        for(var i=0;i<Stops.length;i++){
          totalVac+=Stops[i].vaccinated;
        }
        res.json({success:true,stops:Stops, totalVaccinated:totalVac})
      }
      catch(err){
        res.json({success:false,msg:err})
      }
   },
   update:async(req,res)=>{
     const {stopId}=req.body;
     const stop = await Stop.findOne({where:{id:stopId}});
     stop.changed("updatedAt",true)
     await stop.update({updatedAt:new Date()});
     res.json({stop:stop})
   },
   deleteTodayStops:async(req,res)=>{
    const TODAY_START = new Date().setHours(0, 1, 0, 0);
    var NOW = new Date();
    //NOW.setHours( NOW.getHours() + 1 );
    try{
      
    const Stops = await Stop.destroy({where:{
      createdAt: { [Op.between]:[TODAY_START,NOW]} 
      }});
      res.json({stop:"deleted success"})
    }
    catch{
      res.json({stop:"deleted error"})
    }
   },
   getStopsbyId:async(req,res)=>{
     const {AmbulanceId}=req.body;
     const TODAY_START = new Date().setHours(0, 1, 0, 0);
     var NOW = new Date();
     var Stops=[];
     var duplicates=[];
     try{
     const rawStops=await Stop.findAll({where:{
       AmbulanceId:AmbulanceId,
       createdAt: { [Op.between]:[TODAY_START,NOW]}
      },attributes:["id","address","vaccinated","createdAt","updatedAt"]});
      
      // get time difference :
      for(var i=0;i<rawStops.length;i++){
        var diffMs = rawStops[i].updatedAt - rawStops[i].createdAt;
        var vacc =  rawStops[i].vaccinated;
        var startDate = rawStops[i].createdAt;
        if(vacc==0){
        startDate = new Date(startDate.setMinutes(startDate.getMinutes() - 20)).toISOString();
        }
        var endDate = rawStops[i].updatedAt;
        var diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
        var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
        var diffTimeLocal = diffHrs+"h "+diffMins+"min"
        var diffTimeHours = diffHrs + (diffMins/60)
        //var Stopelement={adress:rawStops[i].address,time:diffTimeLocal,vaccinated:rawStops[i].vaccinated}
        for(var j=i;j<rawStops.length;j++){
             if(rawStops[i].address==rawStops[j].address && i!=j){
                   duplicates.push(rawStops[j].id);
                   vacc += rawStops[j].vaccinated;
                   diffMs += rawStops[j].updatedAt - rawStops[j].createdAt ;
                   endDate = rawStops[j].updatedAt
                   diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
                   diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
                   diffTimeLocal = diffHrs+"h "+diffMins+"min"
                   diffTimeHours = diffHrs + (diffMins/60)
             }
        }
        if(duplicates.includes(rawStops[i].id)==false){
        Stops.push({adress:rawStops[i].address,timeInhours:diffTimeHours,time:diffTimeLocal,vaccinated:vacc, startDate:startDate,endDate:endDate});
      }}
    


     res.json({success:true,stops:Stops})
     }
     catch(err){
       console.log(err)
       res.json({success:err})
     }
    },
   create:async (req,res)=>{
    const { AmbulanceId,lat,lng,rtls,vaccinated,address } = req.body;
    const newStopQuery = {AmbulanceId:AmbulanceId,lat:lat,lng:lng,rtls:rtls,vaccinated:vaccinated,address:address} 
    
    try
    {
    const newStop=await Stop.create(newStopQuery);
    res.json({success:true,msg:"created",stopId:newStop.id})
     }
    catch(err)
    {
        console.log(err);res.json({success:false,msg:"failed"})
    }
},

   
   
}
module.exports=stopController



