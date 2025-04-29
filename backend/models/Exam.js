const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    title: {type: String,required: true,},
    description: {type: String,required: true,},
    publicCible: {type: String,required: true,},
    examLink: {type: String,required: true,unique: true,},
    teacher: {type: mongoose.Schema.Types.ObjectId,ref: 'User',required: true,},
}, { timestamps: true });

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam;
