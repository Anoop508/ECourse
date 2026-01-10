const express = require('express');
const authRoutes = require('../routes/auth.routes')
const adminRoutes = require('../routes/admin.routes')
const cookieParser = require('cookie-parser');
// import cors from 'cors';
const cors = require('cors');


const app = express();
app.use(cookieParser());
app.use(express.json());

app.get('/test', (req, res) =>{
    res.send('Testing');
})

app.use(cors({
  origin: "http://localhost:5173", // React dev server
  credentials: true,               // Allow cookies or auth headers if needed
}));

app.use('/api/auth', authRoutes );
app.use('/api/admin', adminRoutes);


module.exports = app;