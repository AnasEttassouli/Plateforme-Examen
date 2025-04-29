const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    student: {type: mongoose.Schema.Types.ObjectId,ref: 'User',required: true,},
    exam: {type: mongoose.Schema.Types.ObjectId,ref: 'Exam',required: true,},
    score: {type: Number,required: true,},
    location: {latitude: {type: Number,required: true,},
    longitude: {type: Number,required: true,},}
}, { timestamps: true });

const Result = mongoose.model('Result', resultSchema);

module.exports = Result;
