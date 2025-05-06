let questions = [];
let current = 0;
let correctAnswers = 0;
let studentAnswers = [];
let examId = "";
const timePerQuestion = 10;
let countdown;

// 📌 جلب الأسئلة ومعلومات الامتحان من الخادم (مع الرابط الديناميكي)
function fetchQuestions() {
  const params = new URLSearchParams(window.location.search);
  const examLink = params.get("exam");

  if (!examLink) {
    alert("Lien d'examen manquant dans l'URL.");
    return;
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      document.getElementById('geoStatus').innerText =
        `Localisation enregistrée : (${position.coords.latitude}, ${position.coords.longitude})`;

      fetch(`http://localhost:5000/api/student/exam/${examLink}`, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
      })
        .then(res => res.json())
        .then(data => {
          questions = data.questions;
          examId = data.exam._id;

          if (!questions || questions.length === 0) {
            alert("Aucune question trouvée pour cet examen.");
            return;
          }

          startCountdown();
        })
        .catch(error => {
          alert("Impossible de charger les questions depuis le serveur");
          console.error(error);
        });

    }, () => {
      alert("La géolocalisation est requise pour commencer l'examen.");
    });
  } else {
    alert("La géolocalisation n'est pas supportée par votre navigateur.");
  }
}

function startCountdown() {
  let counter = 5;
  const timerEl = document.getElementById('timer');
  timerEl.innerText = `L'examen commencera dans ${counter} secondes`;

  const countdownInterval = setInterval(() => {
    counter--;
    timerEl.innerText = `L'examen commencera dans ${counter} secondes`;
    if (counter <= 0) {
      clearInterval(countdownInterval);
      showQuestion();
    }
  }, 1000);
}

function showQuestion() {
  if (current < questions.length) {
    const question = questions[current];
    const questionText = question.text || question.questionText || "Question non définie";
    document.getElementById('question').innerText = questionText;
    document.getElementById('answerInput').value = "";
    startTimer();
  } else {
    showResult();
  }
}

function startTimer() {
  clearInterval(countdown);
  let timeLeft = timePerQuestion;
  const timerEl = document.getElementById('timer');
  timerEl.innerText = `Temps restant : ${timeLeft} secondes`;

  countdown = setInterval(() => {
    timeLeft--;
    timerEl.innerText = `Temps restant : ${timeLeft} secondes`;
    if (timeLeft <= 0) {
      clearInterval(countdown);
      nextQuestion();
    }
  }, 1000);
}

function nextQuestion() {
  clearInterval(countdown);
  const answer = document.getElementById('answerInput').value.trim();
  const currentQuestion = questions[current];

  if (answer !== "") {
    studentAnswers.push({
      questionId: currentQuestion._id,
      answer: answer
    });

    if (currentQuestion.questionType === "direct" && currentQuestion.directAnswer) {
      const expected = currentQuestion.directAnswer.trim().toLowerCase();
      const given = answer.trim().toLowerCase();
      if (expected === given) correctAnswers++;
    }

    if (currentQuestion.questionType === "qcm" && Array.isArray(currentQuestion.qcmOptions)) {
      const correctOption = currentQuestion.qcmOptions.find(opt => opt.isCorrect);
      if (correctOption) {
        const expected = correctOption.optionText.trim().toLowerCase();
        const given = answer.trim().toLowerCase();
        if (expected === given) correctAnswers++;
      }
    }
  }

  current++;
  showQuestion();
}


function showResult() {
  document.getElementById('exam').style.display = 'none';
  document.getElementById('result').style.display = 'block';

  navigator.geolocation.getCurrentPosition((position) => {
    const payload = {
      answers: studentAnswers,
      location: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }
    };

    fetch(`http://localhost:5000/api/student/submit-exam/${examId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        document.getElementById('score').innerText =
          `Votre score est : ${data.finalScore} / 100`;
      })
      .catch(err => {
        console.error("Erreur lors de la soumission:", err);
        document.getElementById('score').innerText =
          "Erreur lors de la soumission des résultats.";
      });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  fetchQuestions();
});
