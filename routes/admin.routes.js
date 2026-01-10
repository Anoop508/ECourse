const express = require('express');
const admin = require('../controllers/admin.controller') 

const router = express.Router();

router.get('/userList', admin.userList);
// router.get('/foodPartnerList', admin.foodPatnerList);
router.put('/updateUserInfo/:email',  admin.updateUserDetails);
// router.put('/updateFoodPartnerInfo/:email',  admin.updatefoodPatnerDetails);
router.get('/sendEmailforUserDetailsAppoval/:email', admin.sendEmailforUserDetailsAppoval);

module.exports = router;