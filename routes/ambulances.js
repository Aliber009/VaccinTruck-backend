const express = require('express');
const router = express.Router();
const ambulanceController=require('../Controllers/ambulanceController')

router.get('/getall',ambulanceController.getAll)
router.post('/getallbyday',ambulanceController.getAllbyDay)

module.exports=router