
const Position = require('../models/position');
const {Op}=require('sequelize');
const Ambulance = require('../models/ambulance');
const moment=require('moment');

const PositionController={
  
 todayPosition:async (req,res)=>{
    const TODAY_START = new Date().setHours(0, 0, 0, 0);
    const NOW = new Date();  
    try{
    const ambulances=await Ambulance.findAll();
    var Pos=[]
    for(var i=0;i<ambulances.length;i++)
    {
       const position= await ambulances[i].getPositions(
           {
               where:{
                createdAt: { 
                    [Op.gt]: TODAY_START,
                    [Op.lt]: NOW
                  },
           }
        });
        if(position.length>0)
        {
        Pos.push({[ambulances[i].id]:position })
        }
    }
    res.json({success:true,Positions:Pos})
  }
  catch{
    res.json({success:false,Positions:"error"})
  }   
 },   
 positionByDay:async (req,res)=>{

    const {day}=req.body;
    const DayTime=new Date(day);
    const DayTimePlusOne = new Date(moment(DayTime, "DD-MM-YYYY").add(1, 'days'));
    var Pos=[]
     try{
            const ambulances=await Ambulance.findAll();
            //get device last positions:
            for(var i=0;i<ambulances.length;i++){
            const position=await Position.findAll({
                attributes:['AmbulanceId','lat','lng','Attributes','gpsTime'],
                where:{
                    AmbulanceId:ambulances[i].id,
                    gpsTimeFixed: { [Op.between]:[DayTime,DayTimePlusOne]} 
                    },
                order: [['createdAt', 'DESC']],
              });
              if(position.length>0)
               {
                Pos.push({[ambulances[i].id]:position })
               }
          }
          res.json({success:true,Positions:Pos})
        }
    catch{
        res.json({success:false})
         }
    }
}
module.exports=PositionController
