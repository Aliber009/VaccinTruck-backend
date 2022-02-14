const express = require('express');
const router = express.Router();
const stopController=require('../Controllers/stopController')


router.post('/create',stopController.create)
router.post('/update',stopController.update)
router.get('/getstops',stopController.getStops)
router.post('/getstopsbyId',stopController.getStopsbyId)
router.get('/deletestops',stopController.deleteTodayStops)
module.exports=router