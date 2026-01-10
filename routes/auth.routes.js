const express = require('express');
const userAuth = require('../controllers/auth.controller');
const verifyAdminToken = require('../middleware/authAdmin');
const verifyUserToken = require('../middleware/authUser');

const router = express.Router();

// router.post('/admin/register', userAuth.registerAdminUser);
// router.post('/admin/login', userAuth.loginAdmin);
// router.post('/admin/logout', verifyAdminToken, userAuth.logoutAdmin);
// router.get('/admin/userList', verifyAdminToken, userAuth.getUserList);


router.post('/user/register', userAuth.registerUser);
router.post('/user/login',  userAuth.userlogin);
router.post('/user/logout', verifyUserToken, userAuth.logoutUser)
router.put('/user/update', verifyUserToken, userAuth.UpdateUserPassword);
router.get('/user/view-pdf', verifyAdminToken, verifyUserToken, userAuth.viewpdf);

router.get('/admin/userList', verifyAdminToken, verifyUserToken, userAuth.getUserList);
router.post('/admin/generate-upload-url', verifyAdminToken, verifyUserToken, userAuth.generateUploadpdfurl)
router.post('/admin/save-pdf', verifyAdminToken, verifyUserToken, userAuth.savepdf)


// router.post('/foodPatner/register', userAuth.foodPartnerRegister);
// router.post('/foodPatner/login', userAuth.loginFoodPatner);

module.exports = router;