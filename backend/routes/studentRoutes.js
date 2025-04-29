const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Result = require('../models/Result');

const router = express.Router();

router.use(authMiddleware);

const isStudent = (req, res, next) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Access forbidden: Students only' });
    }
    next();
};

router.get('/exam/:examLink', isStudent, async (req, res) => {
    try {
        const { examLink } = req.params;

        const exam = await Exam.findOne({ examLink });

        if (!exam) {
            return res.status(404).json({ message: 'Examen introuvable' });
        }

        const questions = await Question.find({ exam: exam._id }).select('-directAnswer -qcmOptions.isCorrect');

        res.json({ exam, questions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/submit-exam/:examId', isStudent, async (req, res) => {
    try {
        const { examId } = req.params;
        const { answers, location } = req.body;

        const questions = await Question.find({ exam: examId });

        let totalScore = 0;
        let obtainedScore = 0;

        questions.forEach((question) => {
            totalScore += question.score;

            const studentAnswer = answers.find(ans => ans.questionId === String(question._id));

            if (studentAnswer) {
                if (question.questionType === 'direct') {
                    const expected = question.directAnswer.trim().toLowerCase();
                    const given = studentAnswer.answer.trim().toLowerCase();
                    const tolerance = question.toleranceRate || 0;

                    const distance = calculateStringDistance(expected, given);

                    if (distance <= tolerance) {
                        obtainedScore += question.score;
                    }
                } else if (question.questionType === 'qcm') {
                    const correctOptions = question.qcmOptions.filter(opt => opt.isCorrect).map(opt => opt.optionText);
                    const studentOptions = studentAnswer.selectedOptions || [];

                    if (arraysEqual(correctOptions, studentOptions)) {
                        obtainedScore += question.score;
                    }
                }
            }
        });

        const finalScore = Math.round((obtainedScore / totalScore) * 100);

        const newResult = new Result({
            student: req.user.userId,
            exam: examId,
            score: finalScore,
            location
        });

        await newResult.save();

        res.json({ message: 'Examen soumis avec succès', finalScore });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

function calculateStringDistance(a, b) {
    if (a === b) return 0;
    return Math.abs(a.length - b.length);
}

function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    return arr1.sort().join(',') === arr2.sort().join(',');
}

module.exports = router;
