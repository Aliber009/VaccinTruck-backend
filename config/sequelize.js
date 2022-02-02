const Sequelize = require('sequelize');


const sequelize = new Sequelize('postgres://postgres:jesuisber@localhost:5432/ambulanceDB');
sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
  module.exports=sequelize