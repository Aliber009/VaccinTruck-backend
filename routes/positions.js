const express = require('express');
const router = express.Router();
const PositionController=require('../Controllers/positionController')

router.get('/todayPositions',PositionController.todayPosition)
router.post('/DayPositions',PositionController.positionByDay)
router.get('/test',PositionController.testPos)
module.exports=router