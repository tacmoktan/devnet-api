const mongoose = require('mongoose');

const connectionString = 'mongodb+srv://tashi123:tashi123@backend-ym5zo.mongodb.net/test?retryWrites=true&w=majority';

const connectDB = async () =>{
    try{
        await mongoose.connect(connectionString, {useNewUrlParser: true});
        console.log('MongoDB connected..');
        
    }catch(err){
        console.error(err.message);
        //exit process with failure
        process.exit(1)
    }
}

module.exports = connectDB;