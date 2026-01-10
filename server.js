const app = require('./src/app');
const connectDB = require('./db/db')
const dotenv = require("dotenv");

dotenv.config();
connectDB();

app.listen(process.env.PORT, ()=>{
    console.log('Server is running on port 3001')
})