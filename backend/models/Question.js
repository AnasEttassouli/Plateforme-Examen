const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    exam: {type: mongoose.Schema.Types.ObjectId,ref: 'Exam',required: true,},
    questionText: {type: String,required: true,},
    questionType: {type: String,enum: ['direct', 'qcm'],required: true,},
    attachment: {type: String,},
    directAnswer: {type: String, },
    toleranceRate: {type: Number, default: 0,},
    qcmOptions: [{optionText: String,isCorrect: Boolean,}],
    score: {type: Number,required: true,},
    durationInSeconds: {type: Number,required: true,},
}, { timestamps: true });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
