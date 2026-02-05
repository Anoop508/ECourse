const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    gender: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
        // select: false,
    },
    contactNumber: {
        type: Number,
        required: true
    },
    isAdmin: { 
        type: Boolean, 
        default: false 
    },
},
    {
        timestamp: true,
    })

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;