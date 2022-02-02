const Stop = require('../models/stop');
const {Op}=require('sequelize');
const Position = require('../models/position');
const moment=require('moment');



const stopController = {
   getStops:async (req,res)=>{
      try{
        const DayTime=new Date();
        const DayTimePlusOne = new Date(moment(DayTime, "DD-MM-YYYY").add(-1, 'days'));
        console.log("days: "+DayTime+ " next: "+DayTimePlusOne )
        const Stops = await Stop.findAll({where:{
          createdAt: { [Op.between]:[DayTime,DayTimePlusOne]} 
          }});
        res.json({success:true,stops:Stops})
      }
      catch(err){
        res.json({success:false,msg:err})
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



