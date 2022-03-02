const axios = require('axios');

const geocode=async(lat,lng)=>{
    var place=""
     const address= await axios.get("https://api.openrouteservice.org/geocode/reverse?api_key=5b3ce3597851110001cf6248c30d22daa07c488192c7803c2ec18cb6&point.lon="+lng+"&point.lat="+lat)
     const {data}=await address
     place=data.features[0].properties.label;
     return place
}

module.exports=geocode;