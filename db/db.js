const mongoose = require('mongoose');

const connectDB = () => {
    mongoose.connect(process.env.MONGO_URI,  { useNewUrlParser: true, useUnifiedTopology: true }).then(()=>{
        console.log('DB Connected Successfully');
    }).catch((error) =>{
        console.log('Getting error...', error);
    })
}

module.exports = connectDB;