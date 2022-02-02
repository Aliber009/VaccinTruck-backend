

const ActiveSession = require('../models/activeSession');

const reqAuth = async (req, res, next) => {
  const token = String(req.headers.authorization);
  try{
  const session=await ActiveSession.findAll({where:{token: token}})
    if (session.length == 1) {
      return next();
    } else {
      return res.json({success: false, msg: 'User is not logged on'}); 
    }
  }
  catch{
    return res.json({success: false, msg: 'Error occured'});
  }
};

module.exports = {
  reqAuth: reqAuth,
};
