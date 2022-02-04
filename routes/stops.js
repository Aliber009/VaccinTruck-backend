const express = require('express');
const router = express.Router();
const stopController=require('../Controllers/stopController')


router.post('/create',stopController.create)
router.post('/increment',stopController.increment)
router.get('/getstops',stopController.getStops)
module.exports=router