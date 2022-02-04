const Ambulance = require('../models/ambulance');
const  Position = require('../models/position');
const Stop = require('../models/stop');
const {Op}=require('sequelize');
const moment=require('moment');
const geocode=require('../services/geocoder')


const ambulanceController={
getAll:async function(req, res) {

    const TODAY_START = new Date().setHours(0, 0, 0, 0);
    const NOW = new Date();
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
const TODAY_START = new Date().setHours(0, 0, 0, 0);
const NOW = new Date();
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
      const ambulanceStop=await ambulance.getStops(
        {where:{
             createdAt: { 
                 [Op.gt]: TODAY_START,
                 [Op.lt]: NOW
               },
        }});
    
      
    res.json({ambulance:ambulance,TotalVaccin:ambulance.vaccinCount,lastpos:{...LastPos.dataValues,address:address},stops:ambulanceStop})
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