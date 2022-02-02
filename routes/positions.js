const express = require('express');
const router = express.Router();
const PositionController=require('../Controllers/positionController')

router.get('/replay',PositionController.replay)
router.get('/lastposition',PositionController.lastPosition)

module.exports=router