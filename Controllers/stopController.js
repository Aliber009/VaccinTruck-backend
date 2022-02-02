const Stop =require('../models/stop');
const {Op}=require('sequelize');
const Position = require('../models/position');



const stopController = {
   getStops:async (req,res)=>{
      try{
        const Stops=Stop.findAll();
        res.json({success:true,stops:Stops})
      }
      catch{
        res.json({success:true,msg:"error occuried"})
      }
   },
   create:async (req,res)=>{
   
    const {AmbulanceId,lat,lon,rtls,vaccinated,address}=req.body;
    const newStopQuery = {AmbulanceId:AmbulanceId,lat:lat,lon:lon,rtls:rtls,vaccinated:vaccinated,address:address} 
    
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



