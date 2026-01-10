
const userModel = require('../models/user.model')
const pdf = require('../models/pdf.model')
// const foodPatnerModel = require('../models/foodPather.model')
// const adminModel = require('../models/admin.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { userList } = require('./admin.controller');
const AWS = require("aws-sdk");

require("dotenv").config();

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    // region: process.env.AWS_REGION,
    region: 'ap-south-1',
    signatureVersion: "v4"
});

const s3 = new AWS.S3();


async function registerUser(req, res) {

    const { name, email, gender, password, contactNumber, isAdmin } = req.body;

    const isUserAlreadyExist = await userModel.findOne({
        email,
    })
    if (isUserAlreadyExist) {
        return res.status(401).json({
            message: "User already exists"
        })
    }

    const hashpass = await bcrypt.hash(password, 10);
    const user = await userModel.create({
        name, email, gender, password: hashpass, role: 'user', contactNumber, isAdmin
    })

    const { password: pwd, ...safeUser } = user.toObject();
    var token = await jwt.sign({ id: user._id, isAdmin }, process.env.JWT_SECRET);
    // res.cookie("okenReg", token)

    res.status(201).json({
        message: 'User registered successfully',
        token: token,
        user: safeUser,
    })
}

async function userlogin(req, res) {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email }).select('-__v');

    if (!user) {
        return res.status(403).json({
            message: 'Invalid email id'
        })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
        const { password: pwd, ...safeUser } = user.toObject();
        const token = jwt.sign({ id: user.__id, isAdmin: user.isAdmin }, process.env.JWT_SECRET);
        // res.cookie('tokenLogin', token);

        res.status(200).json({
            message: 'User logged Successfully',
            token: token,
            user: safeUser,
        })
    } else {
        res.status(401).json({
            message: 'User Password Invalid'
        })
    }
}

async function UpdateUserPassword(req, res) {

    const { email, contactNumber, newPassword } = req.body;

    const user = await userModel.findOne({
        email, contactNumber
    })
    if (!user) {
        return res.status(403).json({
            message: 'Email and contact number do not match'
        })
    }

    const hashpass = await bcrypt.hash(newPassword, 10);
    user.password = hashpass;

    await user.save();

    return res.status(200).json({
        message: 'Password updated successfully'
    });
}

async function logoutUser(req, res) {
    try {
        res.clearCookie('TokenAdmin', {
            httpOnly: true,
            secure: true,      // true in production (HTTPS)
            sameSite: 'strict'
        });

        return res.status(200).json({
            message: 'Admin logged out successfully'
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Logout failed'
        });
    }
}

async function getUserList(req, res) {

    try {
        const userList = await userModel.find().select('-_id -password -__v');

        if (userList) {
            res.status(200).json({
                message: 'User List fetch successfully',
                data: userList
            })
        }
    } catch {
        res.status(500).json({
            message: 'Something Went wrong'
        })
    }

}

async function generateUploadpdfurl(req, res) {
    const { fileName } = req.body;
    const s3Key = `pdfs/${Date.now()}-${fileName}`;
    const uploadUrl = s3.getSignedUrl("putObject", {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key,
        ContentType: "application/pdf",
        Expires: 60
    });
    res.json({ uploadUrl, s3Key });
}

async function savepdf(req, res) {
    const { title, s3Key } = req.body;
    const pdfres = await pdf.create({ title, s3Key });
    res.json({ message: "PDF saved", pdfres });

}

async function viewpdf(req, res) {
    try{
    const { s3Key } = req.body;

    const signedUrl = s3.getSignedUrl("getObject", {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key,
        Expires: 600 // 10 minutes
    });

    res.json({ url: signedUrl });
    }
    catch(err){
        res.status(500).json({
            message: "Something went wrong",
            error: err
        })
    }
}

module.exports = { registerUser, userlogin, UpdateUserPassword, logoutUser, getUserList, generateUploadpdfurl, savepdf, viewpdf }