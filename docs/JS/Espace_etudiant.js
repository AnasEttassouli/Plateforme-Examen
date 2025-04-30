// Données des questions
const questions = [
    { text: "2 + 2 = ?", correct: "4" },
    { text: "Capitale de la France ?", correct: "Paris" },
    { text: "Couleur du ciel ?", correct: "Bleu" }
  ];
  
  let current = 0;
  let correctAnswers = 0;
  let countdown;
  const timePerQuestion = 10; // secondes
  
  // (commit: affichage questions enchaînées avec timer)
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
    document.getElementById('timer').innerText = `Temps restant: ${timeLeft}s`;
  
    countdown = setInterval(() => {
      timeLeft--;
      document.getElementById('timer').innerText = `Temps restant: ${timeLeft}s`;
      if (timeLeft <= 0) {
        clearInterval(countdown);
        nextQuestion();
      }
    }, 1000);
  }
  
  function nextQuestion() {
    clearInterval(countdown);
    const answer = prompt("Votre réponse:");
    if (answer && answer.trim().toLowerCase() === questions[current].correct.toLowerCase()) {
      correctAnswers++;
    }
    current++;
    showQuestion();
  }
  
  // (commit: enregistrement géolocalisation)
  function requestGeolocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        document.getElementById('geoStatus').innerText =
          `Localisation enregistrée: (${position.coords.latitude}, ${position.coords.longitude})`;
        showQuestion();
      }, () => {
        alert("La géolocalisation est requise pour commencer l'examen.");
      });
    } else {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
    }
  }
  
  // (commit: calcul score et affichage)
  function showResult() {
    document.getElementById('exam').style.display = 'none';
    document.getElementById('result').style.display = 'block';
    const finalScore = Math.round((correctAnswers / questions.length) * 100);
    document.getElementById('score').innerText = `Votre score est: ${finalScore}/100`;
  }
  
  // Gestion de la connexion
  function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    if (username && password) {
      document.getElementById('login').style.display = 'none';
      document.getElementById('exam').style.display = 'block';
      requestGeolocation();
    } else {
      alert("Veuillez entrer un nom d'utilisateur et un mot de passe.");
    }
  }
  
  // Initialisation
  document.getElementById('login').style.display = 'block';
  