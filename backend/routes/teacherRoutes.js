const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Result = require('../models/Result');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Middleware d'authentification
router.use(authMiddleware);

// Vérifie que l'utilisateur est un enseignant
const isTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Access forbidden: Teachers only' });
  }
  next();
};

// ✅ Créer un examen
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

// ✅ Ajouter une question
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

// ✅ Modifier une question
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

// ✅ Supprimer une question
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

// ✅ Obtenir les examens de l’enseignant
router.get('/my-exams', isTeacher, async (req, res) => {
  try {
    const exams = await Exam.find({ teacher: req.user.userId });
    res.json(exams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Obtenir les résultats d’un examen
router.get('/exam-results/:examId', isTeacher, async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findOne({ _id: examId, teacher: req.user.userId });
    if (!exam) return res.status(403).json({ message: 'Accès refusé à cet examen' });

    const results = await Result.find({ exam: examId })
      .populate('student', 'fullName email')
      .sort({ score: -1 });

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Obtenir tous les examens avec leurs questions (NOUVEAU)
router.get('/my-exams-with-questions', isTeacher, async (req, res) => {
  try {
    const exams = await Exam.find({ teacher: req.user.userId });

    const examsWithQuestions = await Promise.all(exams.map(async (exam) => {
      const questions = await Question.find({ exam: exam._id });

      return {
        _id: exam._id,
        title: exam.title,
        description: exam.description,
        publicCible: exam.publicCible,
        examLink: exam.examLink,
        questions: questions.map(q => ({
          _id: q._id,
          text: q.questionText,
          type: q.questionType,
          options: q.qcmOptions,
          bonnesReponses: q.qcmOptions?.correctAnswers || [],
          reponseDirecte: q.directAnswer,
          tolerance: q.toleranceRate,
          note: q.score,
          duree: q.durationInSeconds
        }))
      };
    }));

    res.json(examsWithQuestions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;

