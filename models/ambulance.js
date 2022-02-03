const sequelize=require('../config/sequelize')
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
      }

})

Ambulance.sync()
module.exports=Ambulance
