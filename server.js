const express = require('express');
const connectDB = require('./config/db');
const app = express();

//connect database
connectDB();

//init middleware to get req.body
app.use(express.json());

app.get('/', (req, res) => res.send('API running'));

const PORT = process.env.PORT || 5000;

//Define routes
app.use('/api/user', require('./routes/api/users'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profiles'));


app.listen(PORT, () => console.log(`server running on port ${PORT}`))
