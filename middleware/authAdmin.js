const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

const verifyAdminToken = async(req, res, next) => {
     // 1. Get token from cookie
    // const token = req.cookies.TokenAdmin;
    const token = req.header("Authorization")?.replace("Bearer ", "");


    // OR: Authorization header
    // const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'Access denied. Token missing.'
      });
    }
  try {
   
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Attach decoded data to request
    req.user = decoded;

    // Optional: role check
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admins only' });
    }



    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token'
    });
  }
};

module.exports = verifyAdminToken;
