
const {Position} =require('../models/position');
const {Op}=require('sequelize')

const PositionController={
  
 lastPosition:(req,res)=>{
    const ambulanceId=req.query.ambulanceId;
    Position.findOne({
        attributes: ['lat' , 'lng'] ,
        where:{
        ambulanceId:ambulanceId},
        order: [['createdAt', 'DESC']],
    })
    .then(pos=>{res.json({success:true,currentposition:[parseFloat(pos.lat),parseFloat(pos.lng)]})})
    .catch(err=>{res.json({success:false,msg:err})})

 },   
 replay:async (req,res)=>{
     const ambulanceId=req.query.ambulanceId;
     //Date to cast the string in the query params 
     const from=req.query.from;
     const to=req.query.to; 
     try{
     const pos =await Position.findAll({
        attributes: ['lat' , 'lng'] ,
        where:{
        [Op.and]:[ 
        {ambulanceId:ambulanceId},
        {gpsTime:
            { [Op.between]:[from,to]} }
        ]
      },
      order: [['createdAt', 'ASC']],
     })
     res.json({success:true,positions:pos})
    }
    catch{
        res.json({success:false})
         }
    }
}
module.exports=PositionController
