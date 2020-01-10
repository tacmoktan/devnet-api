const express = require('express');
const connectDB = require('./config/db');
const app = express();

//connect database
connectDB();

app.get('/', (req, res) => res.send('API running'));

const PORT = process.env.PORT || 5000;

//Define routes
app.use('/api/user', require('./routes/api/user'));
app.use('/api/post', require('./routes/api/post'));


app.listen(PORT, () => console.log(`server running on port ${PORT}`))
