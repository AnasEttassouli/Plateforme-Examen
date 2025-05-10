document.addEventListener('DOMContentLoaded', async () => {
   
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Veuillez vous connecter pour accéder à cet examen');
        window.location.href = 'connexion.html';
        return;
    }

    
    const urlParams = new URLSearchParams(window.location.search);
    const examLink = urlParams.get('exam');
    if (!examLink) {
        alert('Lien d\'examen invalide');
        window.location.href = 'connexion.html';
        return;
    }

    
    const geolocationSection = document.getElementById('geolocationSection');
    const examIntroSection = document.getElementById('examIntroSection');
    const questionSection = document.getElementById('questionSection');
    const resultsSection = document.getElementById('resultsSection');
    const enableGeolocationBtn = document.getElementById('enableGeolocationBtn');
    const startExamBtn = document.getElementById('startExamBtn');
    const prevQuestionBtn = document.getElementById('prevQuestionBtn');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    const submitExamBtn = document.getElementById('submitExamBtn');
    const returnHomeBtn = document.getElementById('returnHomeBtn');
    const questionCounter = document.getElementById('questionCounter');
    const questionTimer = document.getElementById('questionTimer');
    const globalTimer = document.getElementById('globalTimer');
    const examDescription = document.getElementById('examDescription');
    const finalScore = document.getElementById('finalScore');
    const scoreMessage = document.getElementById('scoreMessage');
    const locationDetails = document.getElementById('locationDetails');
    const totalTime = document.getElementById('totalTime');

    
    let examData = null;
    let questions = [];
    let currentQuestionIndex = 0;
    let answers = {};
    let location = null;
    let questionTimeLeft = 0;
    let globalTimeElapsed = 0;
    let questionInterval = null;
    let globalInterval = null;

    
    try {
        
        const response = await fetch(`http://localhost:5000/api/student/exam/${examLink}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Impossible de charger l\'examen');
        }

        const data = await response.json();
        examData = data.exam;
        questions = data.questions;

        
        examDescription.innerHTML = `
            <h3>${examData.title}</h3>
            <p>${examData.description}</p>
            <p><strong>Public cible:</strong> ${examData.publicCible}</p>
            <p><strong>Nombre de questions:</strong> ${questions.length}</p>
        `;

        
        questions.forEach((q, index) => {
            answers[index] = {
                questionId: q._id,
                answer: '',
                selectedOptions: []
            };
        });

    } catch (error) {
        console.error('Error loading exam:', error);
        alert('Erreur lors du chargement de l\'examen');
        window.location.href = 'connexion.html';
        return;
    }

    
    enableGeolocationBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    geolocationSection.classList.add('hidden');
                    examIntroSection.classList.remove('hidden');
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    document.getElementById('geolocationError').textContent = 
                        'Erreur de géolocalisation. Vous devez autoriser la localisation pour passer l\'examen.';
                }
            );
        } else {
            document.getElementById('geolocationError').textContent = 
                'La géolocalisation n\'est pas supportée par votre navigateur.';
        }
    });

    
    startExamBtn.addEventListener('click', () => {
        examIntroSection.classList.add('hidden');
        questionSection.classList.remove('hidden');
        displayQuestion(currentQuestionIndex);
        startTimers();
    });

    
    prevQuestionBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            saveAnswer(currentQuestionIndex);
            currentQuestionIndex--;
            displayQuestion(currentQuestionIndex);
        }
    });

    nextQuestionBtn.addEventListener('click', () => {
        if (currentQuestionIndex < questions.length - 1) {
            saveAnswer(currentQuestionIndex);
            currentQuestionIndex++;
            displayQuestion(currentQuestionIndex);
        }
    });

    submitExamBtn.addEventListener('click', async () => {
        saveAnswer(currentQuestionIndex);
        clearInterval(questionInterval);
        clearInterval(globalInterval);
        
        try {
            const response = await fetch(`http://localhost:5000/api/student/submit-exam/${examData._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    answers: Object.values(answers),
                    location
                })
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la soumission');
            }

            const result = await response.json();
            showResults(result.finalScore);
        } catch (error) {
            console.error('Submission error:', error);
            alert('Erreur lors de la soumission de l\'examen');
        }
    });

    returnHomeBtn.addEventListener('click', () => {
        window.location.href = 'connexion.html';
    });

    
    function displayQuestion(index) {
        const question = questions[index];
        const questionContent = document.getElementById('questionContent');
        
        
        questionCounter.textContent = `Question ${index + 1}/${questions.length}`;
        
        
        prevQuestionBtn.disabled = index === 0;
        nextQuestionBtn.classList.toggle('hidden', index === questions.length - 1);
        submitExamBtn.classList.toggle('hidden', index !== questions.length - 1);

        
        questionContent.innerHTML = '';
        
        
        const questionText = document.createElement('p');
        questionText.className = 'question-text';
        questionText.textContent = question.questionText;
        questionContent.appendChild(questionText);
        
        
        if (question.questionType === 'direct') {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'direct-answer-input';
            input.placeholder = 'Entrez votre réponse ici...';
            input.value = answers[index].answer || '';
            questionContent.appendChild(input);
        } else if (question.questionType === 'qcm') {
            const optionsList = document.createElement('ul');
            optionsList.className = 'qcm-options';
            
            question.qcmOptions.forEach((option, i) => {
                const li = document.createElement('li');
                li.className = 'qcm-option';
                if (answers[index].selectedOptions.includes(option.optionText)) {
                    li.classList.add('selected');
                }
                
                li.innerHTML = `
                    <input type="checkbox" id="option-${index}-${i}" 
                        ${answers[index].selectedOptions.includes(option.optionText) ? 'checked' : ''}>
                    <label for="option-${index}-${i}">${option.optionText}</label>
                `;
                
                li.addEventListener('click', (e) => {
                    if (e.target.tagName !== 'INPUT') {
                        const checkbox = li.querySelector('input');
                        checkbox.checked = !checkbox.checked;
                    }
                    
                    const checkboxes = optionsList.querySelectorAll('input');
                    const selectedOptions = [];
                    checkboxes.forEach((cb, i) => {
                        if (cb.checked) {
                            selectedOptions.push(question.qcmOptions[i].optionText);
                        }
                    });
                    
                    answers[index].selectedOptions = selectedOptions;
                    li.classList.toggle('selected', checkbox.checked);
                });
                
                optionsList.appendChild(li);
            });
            
            questionContent.appendChild(optionsList);
        }
        
        
        questionTimeLeft = question.durationInSeconds;
        updateQuestionTimerDisplay();
    }

    
    function saveAnswer(index) {
        const question = questions[index];
        const questionContent = document.getElementById('questionContent');
        
        if (question.questionType === 'direct') {
            const input = questionContent.querySelector('.direct-answer-input');
            answers[index].answer = input ? input.value : '';
        }
        
    }

    
    function startTimers() {
        
        globalInterval = setInterval(() => {
            globalTimeElapsed++;
            const minutes = Math.floor(globalTimeElapsed / 60);
            const seconds = globalTimeElapsed % 60;
            globalTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
        
       
        questionInterval = setInterval(() => {
            questionTimeLeft--;
            updateQuestionTimerDisplay();
            
            if (questionTimeLeft <= 0) {
                
                if (currentQuestionIndex < questions.length - 1) {
                    saveAnswer(currentQuestionIndex);
                    currentQuestionIndex++;
                    displayQuestion(currentQuestionIndex);
                } else {
                    submitExamBtn.click();
                }
            }
        }, 1000);
    }

    function updateQuestionTimerDisplay() {
        const minutes = Math.floor(questionTimeLeft / 60);
        const seconds = questionTimeLeft % 60;
        questionTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        
        if (questionTimeLeft <= 10) {
            questionTimer.style.color = '#e74c3c';
            questionTimer.style.fontWeight = 'bold';
        } else {
            questionTimer.style.color = '';
            questionTimer.style.fontWeight = '';
        }
    }

    
    function showResults(score) {
        questionSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        
        finalScore.textContent = score;
        
        
        if (score >= 80) {
            scoreMessage.textContent = 'Excellent travail !';
            scoreMessage.style.color = '#27ae60';
        } else if (score >= 50) {
            scoreMessage.textContent = 'Bon travail !';
            scoreMessage.style.color = '#f39c12';
        } else {
            scoreMessage.textContent = 'Essayez de mieux préparer la prochaine fois.';
            scoreMessage.style.color = '#e74c3c';
        }
        
       
        if (location) {
            locationDetails.textContent = `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
        } else {
            locationDetails.textContent = 'Non disponible';
        }
        
    
        const minutes = Math.floor(globalTimeElapsed / 60);
        const seconds = globalTimeElapsed % 60;
        totalTime.textContent = `${minutes} min ${seconds} sec`;
    }
});
