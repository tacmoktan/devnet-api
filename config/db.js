const mongoose = require('mongoose');
const config = require('config');
const connectionString = config.get('mongoURI');

const connectDB = async () => {
    try {
        await mongoose.connect(connectionString,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useCreateIndex: true,
                useFindAndModify: false
            });

        console.log('MongoDB connected..');

    } catch (err) {
        console.error(err.message);
        //exit process with failure
        process.exit(1)
    }
}

module.exports = connectDB;