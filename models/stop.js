const sequelize=require('../config/sequelize')
 const { DataTypes, Sequelize } = require('sequelize');
const Ambulance = require('./ambulance');

  const Stop = sequelize.define(
    'Stop',
    {
      lat: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lng: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      rtls:{
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      vaccinated:{
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue:0,
      },
      address:{
        type: DataTypes.STRING,
        allowNull: true,
      }

})
Ambulance.hasMany(Stop);
Stop.belongsTo(Ambulance);
Stop.sync()
module.exports=Stop