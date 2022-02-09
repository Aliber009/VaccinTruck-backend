
const Position = require('../models/position');
const {Op}=require('sequelize');
const Ambulance = require('../models/ambulance');
const moment=require('moment');

const PositionController={
  
 todayPosition:async (req,res)=>{
    const TODAY_START = new Date().setHours(0, 1, 0, 0);
    var NOW = new Date();  
    NOW.setHours( NOW.getHours() + 1 );
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
        Pos.push({id:ambulances[i].id,positions:position })
        }
    }
    res.json({success:true,Positions:Pos})
  }
  catch{
    res.json({success:false,Positions:"error"})
  }   
 }, 
 testPos:(req,res) =>{
  var NOW = new Date();
  NOW.setHours( NOW.getHours() + 1 );
  const Now_delay = new Date(NOW.setMinutes(NOW.getMinutes() - 5))
  Position.findAll({
  attributes: ['lat' , 'lng','createdAt'] ,
  where:{ 
  AmbulanceId:1,
  createdAt: {
    [Op.gt]: Now_delay ,
    [Op.lt]:new Date() ,
  }},
  order: [['createdAt', 'DESC']],
  }).then(pos=>{res.json({time:"time is : "+Now_delay+"  next: "+new Date() ,pos:pos})});
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
