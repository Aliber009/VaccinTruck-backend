const sequelize=require('../config/sequelize')
const Sequelize = require("sequelize")
 const { DataTypes } = require('sequelize');

  const Ambulance = sequelize.define(
    'Ambulance',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      imei: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      immatricule:{
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      vaccinCount:{
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue:"0"
      },
      vaccinCountTotal:{
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue:  "0",
      }

})

Ambulance.sync({alter:true})
module.exports=Ambulance
