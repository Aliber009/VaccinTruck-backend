const express = require('express');
const router = express.Router();
const PositionController=require('../Controllers/positionController')

router.get('/todayPositions',PositionController.todayPosition)
router.post('/DayPositions',PositionController.positionByDay)

module.exports=router