let questions = [];
let current = 0;
let correctAnswers = 0;
const timePerQuestion = 10;
let countdown;

// Récupérer les questions depuis le serveur Node.js avec la géolocalisation
function fetchQuestions() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      document.getElementById('geoStatus').innerText =
        `Localisation enregistrée : (${position.coords.latitude}, ${position.coords.longitude})`;

      fetch('http://localhost:3000/questions')
        .then(response => response.json())
        .then(data => {
          questions = data;
          startCountdown();
        })
        .catch(error => {
          alert("Impossible de charger les questions depuis la base de données");
          console.error(error);
        });

    }, () => {
      alert("La géolocalisation est requise pour commencer l'examen.");
    });
  } else {
    alert("La géolocalisation n'est pas supportée par votre navigateur.");
  }
}

// Compte à rebours avant le début de l'examen
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
    document.getElementById('question').innerText = questions[current].text;
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
  const answer = prompt("Entrez votre réponse :");
  if (answer && answer.trim().toLowerCase() === questions[current].correct.toLowerCase()) {
    correctAnswers++;
  }
  current++;
  showQuestion();
}

function showResult() {
  document.getElementById('exam').style.display = 'none';
  document.getElementById('result').style.display = 'block';
  const finalScore = Math.round((correctAnswers / questions.length) * 100);
  document.getElementById('score').innerText = `Votre score est : ${finalScore} / 100`;
}

document.addEventListener('DOMContentLoaded', () => {
  fetchQuestions();
});
