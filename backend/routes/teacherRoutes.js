const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

router.use(authMiddleware);

const isTeacher = (req, res, next) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Access forbidden: Teachers only' });
    }
    next();
};

router.post('/create-exam', isTeacher, async (req, res) => {
    try {
        const { title, description, publicCible } = req.body;

        const newExam = new Exam({
            title,
            description,
            publicCible,
            examLink: uuidv4(),
            teacher: req.user.userId,
        });

        await newExam.save();

        res.status(201).json({ message: 'Examen créé avec succès', exam: newExam });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/add-question/:examId', isTeacher, async (req, res) => {
    try {
        const { examId } = req.params;
        const {
            questionText,
            questionType,
            attachment,
            directAnswer,
            toleranceRate,
            qcmOptions,
            score,
            durationInSeconds
        } = req.body;

        const newQuestion = new Question({
            exam: examId,
            questionText,
            questionType,
            attachment,
            directAnswer,
            toleranceRate,
            qcmOptions,
            score,
            durationInSeconds
        });

        await newQuestion.save();

        res.status(201).json({ message: 'Question ajoutée avec succès', question: newQuestion });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/update-question/:questionId', isTeacher, async (req, res) => {
    try {
        const { questionId } = req.params;
        const updates = req.body;

        const updatedQuestion = await Question.findByIdAndUpdate(questionId, updates, { new: true });

        res.json({ message: 'Question modifiée avec succès', question: updatedQuestion });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/delete-question/:questionId', isTeacher, async (req, res) => {
    try {
        const { questionId } = req.params;

        await Question.findByIdAndDelete(questionId);

        res.json({ message: 'Question supprimée avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

router.get('/my-exams', isTeacher, async (req, res) => {
    try {
        const exams = await Exam.find({ teacher: req.user.userId });
        res.json(exams);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
