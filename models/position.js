const sequelize=require('../config/sequelize')
const { DataTypes } = require('sequelize');
const Ambulance = require('./ambulance');



const Position = sequelize.define('Position',
{
      lat: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lon: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      gpsTime:{
        type:DataTypes.STRING,
        allowNull:false,
        defaultValue:new Date().toISOString()
      },
      gpsTimeFixed:{
        type:DataTypes.DATE,
        allowNull:false,
        defaultValue:new Date()
      },
      Attributes:{
        type: DataTypes.TEXT,
        allonNull: true,
      },
      
})
Ambulance.hasMany(Position);
Position.belongsTo(Ambulance);
Position.sync()


module.exports = Position ;

