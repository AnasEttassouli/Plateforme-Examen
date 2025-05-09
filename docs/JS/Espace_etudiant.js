// Configuration initiale
let currentExam = null;
let questions = [];
let currentQuestionIndex = 0;
let studentAnswers = [];
let timerInterval;
let remainingTime = 0;
let examStartTime;
let locationData = null;

// Éléments DOM
const elements = {
    dashboard: document.getElementById('dashboard'),
    examInterface: document.getElementById('exam-interface'),
    examsContainer: document.getElementById('exams-container'),
    studentName: document.getElementById('student-name'),
    logoutBtn: document.getElementById('logout-btn'),
    joinExamBtn: document.getElementById('joinExamBtn'),
    examLinkInput: document.getElementById('examLinkInput'),
    geoAlert: document.getElementById('geo-alert'),
    geoStatus: document.getElementById('geo-status'),
    examTitle: document.getElementById('exam-title'),
    questionText: document.getElementById('question-text'),
    answerSection: document.getElementById('answer-section'),
    timer: document.getElementById('timer'),
    timeDisplay: document.getElementById('time-display'),
    questionNav: document.getElementById('question-navigation'),
    prevQuestionBtn: document.getElementById('prev-question'),
    nextQuestionBtn: document.getElementById('next-question'),
    submitExamBtn: document.getElementById('submit-exam'),
    resultsModal: document.getElementById('results-modal'),
    finalScore: document.getElementById('final-score'),
    locationInfo: document.getElementById('location-info'),
    closeResultsBtn: document.getElementById('close-results')
};

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    const token = localStorage.getItem('token');
    if (!token) {
        redirectToLogin();
        return;
    }

    const userName = localStorage.getItem('userName');
    elements.studentName.textContent = userName || 'Étudiant';

    setupEventListeners();
    
    // Vérifier si on accède via un lien direct
    const urlParams = new URLSearchParams(window.location.search);
    const examLink = urlParams.get('exam');

    if (examLink) {
        await loadExamByLink(examLink);
    } else {
        await loadExams();
    }
}

function setupEventListeners() {
    elements.logoutBtn.addEventListener('click', logout);
    elements.joinExamBtn.addEventListener('click', () => joinExamByLink(elements.examLinkInput.value.trim()));
    elements.prevQuestionBtn.addEventListener('click', goToPreviousQuestion);
    elements.nextQuestionBtn.addEventListener('click', goToNextQuestion);
    elements.submitExamBtn.addEventListener('click', finishExam);
    elements.closeResultsBtn.addEventListener('click', returnToDashboard);
}

function redirectToLogin() {
    window.location.href = 'connexion.html';
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    redirectToLogin();
}

async function loadExams() {
    showLoadingState(elements.examsContainer, 'Chargement des examens...');
    
    try {
        const response = await fetch('/api/student/exams', {
            headers: getAuthHeader()
        });
        
        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }
        
        const exams = await response.json();
        renderExams(exams);
    } catch (error) {
        console.error('Erreur chargement examens:', error);
        showErrorState(elements.examsContainer, 
            'Erreur lors du chargement des examens', error.message);
    }
}

async function getErrorMessage(response) {
    try {
        const errorData = await response.json();
        return errorData.message || 'Erreur inconnue';
    } catch {
        return `Erreur HTTP ${response.status}`;
    }
}

function getAuthHeader() {
    return {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
    };
}

function showLoadingState(container, message) {
    container.innerHTML = `
        <div class="col-span-full text-center py-10">
            <div class="loading-spinner mx-auto mb-4"></div>
            <p>${message}</p>
        </div>
    `;
}

function showErrorState(container, title, detail = '') {
    container.innerHTML = `
        <div class="col-span-full bg-red-50 border border-red-200 rounded-md p-4 text-center">
            <i class="fas fa-exclamation-circle text-red-500 text-2xl mb-2"></i>
            <p class="text-red-600 font-medium">${title}</p>
            ${detail ? `<p class="text-red-500 mt-1">${detail}</p>` : ''}
            <button onclick="location.reload()" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                <i class="fas fa-sync-alt mr-1"></i> Réessayer
            </button>
        </div>
    `;
}

function renderExams(exams) {
    elements.examsContainer.innerHTML = '';
    
    if (!exams || exams.length === 0) {
        elements.examsContainer.innerHTML = `
            <div class="col-span-full text-center py-10">
                <i class="fas fa-book-open text-3xl text-gray-400 mb-3"></i>
                <p class="text-gray-500">Aucun examen disponible pour le moment</p>
            </div>
        `;
        return;
    }

    exams.forEach(exam => {
        const examCard = createExamCard(exam);
        elements.examsContainer.appendChild(examCard);
    });

    setupExamCardEvents();
}

function createExamCard(exam) {
    const statusConfig = getStatusConfig(exam.status);
    
    const examCard = document.createElement('div');
    examCard.className = 'exam-card bg-white rounded-lg shadow-md overflow-hidden transition duration-300 hover:shadow-lg';
    
    examCard.innerHTML = `
        <div class="${statusConfig.color} text-white px-4 py-3 flex justify-between items-center">
            <h3 class="font-semibold">${exam.title}</h3>
            <span class="text-xs bg-white ${statusConfig.textColor} px-2 py-1 rounded-full">${statusConfig.text}</span>
        </div>
        <div class="p-4">
            <div class="flex justify-between text-sm text-gray-500 mb-3">
                <span><i class="fas fa-calendar-alt mr-1"></i> ${new Date(exam.date).toLocaleDateString()}</span>
                <span><i class="fas fa-clock mr-1"></i> ${exam.duration}</span>
            </div>
            <p class="text-sm text-gray-600 mb-2">${exam.description || 'Aucune description disponible.'}</p>
            <p class="text-sm text-gray-500 mb-2"><i class="fas fa-users mr-1"></i> Public cible : ${exam.publicCible || 'Tous'}</p>
            <div class="flex flex-wrap gap-2 mb-2">
                ${renderExamTags(exam)}
            </div>
            ${renderExamLink(exam, statusConfig)}
            <div class="mt-4">${renderExamButton(exam, statusConfig)}</div>
        </div>
    `;
    
    return examCard;
}

function getStatusConfig(status) {
    const statusMap = {
        'active': {
            text: 'En cours',
            color: 'bg-blue-600',
            textColor: 'text-blue-600',
            buttonClass: 'start-exam bg-blue-600 hover:bg-blue-700'
        },
        'upcoming': {
            text: 'À venir',
            color: 'bg-gray-600',
            textColor: 'text-gray-600',
            buttonClass: 'bg-gray-300 text-gray-500 cursor-not-allowed',
            disabled: true
        },
        'ended': {
            text: 'Terminé',
            color: 'bg-green-600',
            textColor: 'text-green-600',
            buttonClass: 'view-result bg-gray-200 hover:bg-gray-300'
        }
    };
    
    return statusMap[status] || statusMap['upcoming'];
}

function renderExamTags(exam) {
    const tags = [];
    
    if (exam.types?.length) {
        tags.push(...exam.types.map(type => 
            `<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">${type}</span>`
        ));
    }
    
    tags.push(
        `<span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">${exam.questionCount || 0} questions</span>`
    );
    
    return tags.join('');
}

function renderExamLink(exam, statusConfig) {
    if (statusConfig.disabled) {
        return `
            <div class="mt-3 text-xs text-gray-500">
                <i class="fas fa-clock mr-1"></i> Disponible bientôt
            </div>
        `;
    }
    
    if (statusConfig.text === 'Terminé') {
        return `
            <div class="mt-3 text-xs text-gray-500">
                <i class="fas fa-check-circle mr-1"></i> Examen terminé
            </div>
        `;
    }
    
    return `
        <div class="mt-3 text-left">
            <label class="block text-xs text-gray-600 mb-1">Lien d'examen :</label>
            <div class="flex items-center">
                <input type="text" value="${exam.examLink || ''}" class="exam-link-input flex-1 border rounded px-2 py-1 text-xs bg-gray-50" readonly>
            </div>
        </div>
    `;
}

function renderExamButton(exam, statusConfig) {
    if (statusConfig.disabled) {
        return `
            <button disabled class="${statusConfig.buttonClass} px-3 py-1 rounded-md text-sm">
                Indisponible
            </button>
        `;
    }
    
    return `
        <button class="${statusConfig.buttonClass} text-white px-3 py-1 rounded-md text-sm transition" 
                data-id="${exam._id}" data-action="${statusConfig.text === 'Terminé' ? 'view-result' : 'start-exam'}">
            ${statusConfig.text === 'Terminé' ? 
                'Voir résultats <i class="fas fa-chart-bar ml-1"></i>' : 
                'Commencer <i class="fas fa-arrow-right ml-1"></i>'}
        </button>
    `;
}

function setupExamCardEvents() {
    elements.examsContainer.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-id]');
        if (!button) return;
        
        const examId = button.getAttribute('data-id');
        const action = button.getAttribute('data-action');
        
        if (action === 'start-exam') {
            startExam(examId);
        } else if (action === 'view-result') {
            viewResults(examId);
        }
    });
}

async function joinExamByLink(examLink) {
    if (!examLink) {
        showToast('Veuillez entrer un lien d\'examen', 'error');
        return;
    }

    showLoadingState(elements.examsContainer, 'Chargement de l\'examen...');
    
    try {
        const response = await fetch(`/api/student/exam/${encodeURIComponent(examLink)}`, {
            headers: getAuthHeader()
        });
        
        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }
        
        const examData = await response.json();
        await startExam(examData.exam._id);
    } catch (error) {
        console.error('Erreur accès examen:', error);
        showErrorState(elements.examsContainer, 
            'Erreur lors de l\'accès à l\'examen', error.message);
    }
}

async function startExam(examId) {
    try {
        // 1. Obtenir la géolocalisation
        await getGeolocation();
        
        // 2. Charger les données de l'examen
        const examData = await fetchExamData(examId);
        
        // 3. Initialiser l'examen
        initExam(examData);
        
        // 4. Afficher la première question
        showQuestion();
        
    } catch (error) {
        console.error('Erreur démarrage examen:', error);
        showToast(error.message || 'Erreur lors du démarrage de l\'examen', 'error');
        await loadExams(); // Revenir au tableau de bord
    }
}

async function getGeolocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('La géolocalisation n\'est pas supportée'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            position => {
                locationData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                
                elements.geoStatus.textContent = 
                    `Localisation : ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
                elements.geoAlert.classList.remove('hidden');
                resolve();
            },
            error => {
                let errorMessage;
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "L'utilisateur a refusé la demande de géolocalisation";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Les informations de localisation ne sont pas disponibles";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "La demande de localisation a expiré";
                        break;
                    default:
                        errorMessage = "Erreur inconnue de géolocalisation";
                }
                reject(new Error(errorMessage));
            }
        );
    });
}

async function fetchExamData(examId) {
    const response = await fetch(`/api/student/exam-by-id/${examId}`, {
        headers: getAuthHeader()
    });
    
    if (!response.ok) {
        throw new Error(await getErrorMessage(response));
    }
    
    return await response.json();
}

function initExam(examData) {
    currentExam = examData.exam;
    questions = examData.questions;
    currentQuestionIndex = 0;
    studentAnswers = [];
    examStartTime = new Date();
    
    // Mettre à jour l'interface
    elements.examTitle.textContent = currentExam.title;
    elements.dashboard.classList.add('hidden');
    elements.examInterface.classList.remove('hidden');
    
    // Initialiser la navigation entre questions
    initQuestionNavigation();
}

function initQuestionNavigation() {
    elements.questionNav.innerHTML = '';
    
    questions.forEach((_, index) => {
        const btn = document.createElement('button');
        btn.className = 'question-nav-item';
        btn.textContent = index + 1;
        btn.addEventListener('click', () => {
            saveAnswer();
            currentQuestionIndex = index;
            showQuestion();
        });
        elements.questionNav.appendChild(btn);
    });
}

function showQuestion() {
    const question = questions[currentQuestionIndex];
    if (!question) return;
    
    // Afficher le texte de la question
    elements.questionText.textContent = question.questionText || question.text;
    
    // Afficher la section de réponse selon le type de question
    renderAnswerSection(question);
    
    // Charger la réponse précédente si elle existe
    loadPreviousAnswer(question);
    
    // Mettre à jour la navigation
    updateNavigation();
    
    // Démarrer le timer
    startTimer(question.durationInSeconds || 60);
}

function renderAnswerSection(question) {
    elements.answerSection.innerHTML = '';
    
    if (question.questionType === 'qcm') {
        renderQCMOptions(question.qcmOptions);
    } else {
        renderDirectAnswerInput();
    }
}

function renderQCMOptions(options) {
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'space-y-2';
    
    options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'flex items-center';
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `option-${index}`;
        input.name = 'qcm-option';
        input.value = option.optionText;
        input.className = 'mr-2';
        
        const label = document.createElement('label');
        label.htmlFor = `option-${index}`;
        label.textContent = option.optionText;
        
        optionDiv.appendChild(input);
        optionDiv.appendChild(label);
        optionsDiv.appendChild(optionDiv);
    });
    
    elements.answerSection.appendChild(optionsDiv);
}

function renderDirectAnswerInput() {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'direct-answer';
    input.className = 'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
    input.placeholder = 'Entrez votre réponse ici...';
    elements.answerSection.appendChild(input);
}

function loadPreviousAnswer(question) {
    const previousAnswer = studentAnswers.find(a => a.questionId === String(question._id));
    if (!previousAnswer) return;
    
    if (question.questionType === 'qcm') {
        previousAnswer.selectedOptions.forEach(option => {
            const inputs = elements.answerSection.querySelectorAll('input[type="checkbox"]');
            inputs.forEach(input => {
                if (input.value === option) {
                    input.checked = true;
                }
            });
        });
    } else {
        document.getElementById('direct-answer').value = previousAnswer.answer;
    }
}

function updateNavigation() {
    // Boutons précédent/suivant
    elements.prevQuestionBtn.disabled = currentQuestionIndex === 0;
    elements.nextQuestionBtn.classList.toggle('hidden', currentQuestionIndex === questions.length - 1);
    elements.submitExamBtn.classList.toggle('hidden', currentQuestionIndex !== questions.length - 1);
    
    // Navigation entre questions
    const navItems = elements.questionNav.querySelectorAll('.question-nav-item');
    navItems.forEach((item, index) => {
        item.classList.toggle('active', index === currentQuestionIndex);
        item.classList.toggle('answered', studentAnswers.some(a => 
            a.questionId === String(questions[index]._id)
        );
    });
}

function startTimer(duration) {
    clearInterval(timerInterval);
    remainingTime = duration;
    
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        remainingTime--;
        updateTimerDisplay();
        
        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            handleTimerExpiration();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    elements.timeDisplay.textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (remainingTime <= 10) {
        elements.timer.classList.add('bg-red-100', 'text-red-800', 'timer-pulse');
    } else {
        elements.timer.classList.remove('bg-red-100', 'text-red-800', 'timer-pulse');
    }
}

function handleTimerExpiration() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    } else {
        finishExam();
    }
}

function saveAnswer() {
    const question = questions[currentQuestionIndex];
    if (!question) return;
    
    const existingAnswerIndex = studentAnswers.findIndex(a => a.questionId === String(question._id));
    
    if (question.questionType === 'qcm') {
        saveQCMAnswer(question, existingAnswerIndex);
    } else {
        saveDirectAnswer(question, existingAnswerIndex);
    }
}

function saveQCMAnswer(question, existingAnswerIndex) {
    const selectedOptions = Array.from(
        elements.answerSection.querySelectorAll('input[name="qcm-option"]:checked')
    ).map(input => input.value);
    
    if (selectedOptions.length > 0) {
        const answer = {
            questionId: question._id,
            selectedOptions: selectedOptions
        };
        
        updateAnswersArray(answer, existingAnswerIndex);
    }
}

function saveDirectAnswer(question, existingAnswerIndex) {
    const answerText = document.getElementById('direct-answer').value.trim();
    
    if (answerText) {
        const answer = {
            questionId: question._id,
            answer: answerText
        };
        
        updateAnswersArray(answer, existingAnswerIndex);
    }
}

function updateAnswersArray(answer, existingIndex) {
    if (existingIndex >= 0) {
        studentAnswers[existingIndex] = answer;
    } else {
        studentAnswers.push(answer);
    }
}

function goToPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        saveAnswer();
        currentQuestionIndex--;
        showQuestion();
    }
}

function goToNextQuestion() {
    saveAnswer();
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    } else {
        finishExam();
    }
}

async function finishExam() {
    clearInterval(timerInterval);
    showLoadingState(elements.examInterface, 'Soumission des résultats...');
    
    try {
        const response = await fetch(`/api/student/submit-exam/${currentExam._id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({
                answers: studentAnswers,
                location: locationData
            })
        });
        
        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }
        
        const result = await response.json();
        showExamResults(result.finalScore);
    } catch (error) {
        console.error('Erreur soumission examen:', error);
        showToast(error.message || 'Erreur lors de la soumission', 'error');
    }
}

function showExamResults(score) {
    elements.finalScore.innerHTML = 
        `Votre score : <span class="font-bold">${score}/100</span>`;
    elements.locationInfo.textContent = 
        `Localisation : ${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}`;
    
    elements.examInterface.classList.add('hidden');
    elements.resultsModal.classList.remove('hidden');
}

async function viewResults(examId) {
    showLoadingState(elements.dashboard, 'Chargement des résultats...');
    
    try {
        const response = await fetch(`/api/student/exam-results/${examId}`, {
            headers: getAuthHeader()
        });
        
        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }
        
        const result = await response.json();
        showExamResults(result.score);
    } catch (error) {
        console.error('Erreur chargement résultats:', error);
        showErrorState(elements.dashboard, 
            'Erreur lors du chargement des résultats', error.message);
    }
}

function returnToDashboard() {
    elements.resultsModal.classList.add('hidden');
    elements.dashboard.classList.remove('hidden');
    loadExams();
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-4 py-2 rounded-md shadow-lg text-white ${
        type === 'error' ? 'bg-red-500' : 
        type === 'success' ? 'bg-green-500' : 'bg-blue-500'
    }`;
    toast.innerHTML = `
        <i class="fas ${
            type === 'error' ? 'fa-exclamation-circle' : 
            type === 'success' ? 'fa-check-circle' : 'fa-info-circle'
        } mr-2"></i>
        ${message}
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition', 'duration-500');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}