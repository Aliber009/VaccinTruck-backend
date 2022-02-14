const Stop = require('../models/stop');
const {Op}=require('sequelize');
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
   increment:async(req,res)=>{
     const {stopId}=req.body;
     const stop = await Stop.findOne({where:{id:stopId}});
     await stop.increment("vaccinated",{by:1});
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
     try{
     const newStop=await Stop.findAll({where:{AmbulanceId:AmbulanceId},attributes:["address","vaccinated","createdAt","updatedAt"]});
     res.json({success:true,stops:newStop})
     }
     catch{
       res.json({success:false})
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



