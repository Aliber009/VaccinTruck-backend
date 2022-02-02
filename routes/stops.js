const express = require('express');
const router = express.Router();
const stopController=require('../Controllers/stopController')


router.post('/create',stopController.create)
router.get('/getstops',stopController.getStops)
module.exports=router