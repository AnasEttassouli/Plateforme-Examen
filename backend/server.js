const authRouter = require('./routes/auth');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/',(req,res) => {
    res.send('API is running...');
});

mongoose.connect(process.env.MONGO_URI,{
    useNewUrlParser : true, 
    useUnifiedTopology : true,
})
.then(() => console.log('MongoDB Connected'))
.catch((err) => console.log('err'));

app.use('/api/auth', authRouter);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));







