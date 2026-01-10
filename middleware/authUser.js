const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model')

const verifyUserToken = async (req, res, next) => {

    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return res.status(401).json({
            message: 'Access denied. Token missing.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await userModel.findById(decoded.id);
        next();
    } catch (err) {
        return res.status(401).json({
            message: 'Invalid or expired token'
        });
    }
}

module.exports = verifyUserToken;