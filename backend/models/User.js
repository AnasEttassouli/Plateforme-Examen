const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher'], required: true },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    institution: { type: String, required: true },
    filiere: { type: String, required: true },
}, { timestamps: true });


const User = mongoose.model('User', userSchema);

module.exports = User;