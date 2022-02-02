const axios = require('axios');

const geocode=async(lat,lng)=>{
    var place=""
     const address= await axios.get("https://api.openrouteservice.org/geocode/reverse?api_key=5b3ce3597851110001cf624803d896806f2544b6a95312df342a12d7&point.lon="+lng+"&point.lat="+lat)
     const {data}=await address
     place=data.features[0].properties.label;
     return place
}

module.exports=geocode;