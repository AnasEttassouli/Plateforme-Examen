window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = "connexion.html";
    return;
  }


  const createExamForm = document.getElementById('createExamForm');
  const examsContainer = document.getElementById('examsContainer');
  const addQuestionForm = document.getElementById('addQuestionForm');
  const examSelect = document.getElementById('examSelect');
  const menuIcon = document.getElementById("toggleMenu");
  const navList = document.querySelector("nav ul");

  
  window.toggleQuestionType = function() {
    const type = document.getElementById('questionType').value;
    document.getElementById('qcmOptions').style.display = type === 'qcm' ? 'block' : 'none';
    document.getElementById('directAnswerSection').style.display = type === 'directe' ? 'block' : 'none';
  };

  
  document.getElementById('questionType')?.addEventListener('change', toggleQuestionType);

  
  createExamForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('examTitle').value;
    const description = document.getElementById('examDescription').value;
    const publicCible = document.getElementById('examPublic').value;

    try {
      const res = await fetch('http://localhost:5000/api/teacher/create-exam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, publicCible })
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Examen créé avec succès !", 'success');
        createExamForm.reset();
        loadExams();
        populateExamSelect();
      } else {
        throw new Error(data.message || "Erreur lors de la création");
      }
    } catch (err) {
      console.error("Erreur création examen:", err);
      showToast(err.message || "Erreur lors de la création", 'error');
    }
  });

 
  addQuestionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const type = document.getElementById('questionType').value;
    const text = document.getElementById('questionText').value;
    const examId = examSelect.value;
    const note = parseInt(document.getElementById('note').value);
    const duree = parseInt(document.getElementById('duree').value);

    let payload = {
      questionText: text,
      questionType: type === 'directe' ? 'direct' : 'qcm',
      score: note,
      durationInSeconds: duree
    };

    if (type === 'directe') {
      payload.directAnswer = document.getElementById('directAnswer').value;
      payload.toleranceRate = parseInt(document.getElementById('tolerance').value);
    } else if (type === 'qcm') {
      payload.qcmOptions = [];
      ['A', 'B', 'C', 'D'].forEach(opt => {
        payload.qcmOptions.push({
          optionText: document.getElementById('option' + opt).value,
          isCorrect: document.getElementById('correct' + opt).checked
        });
      });
    }

    try {
      const res = await fetch(`http://localhost:5000/api/teacher/add-question/${examId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Question ajoutée avec succès !", 'success');
        addQuestionForm.reset();
        document.getElementById('qcmOptions').style.display = 'none';
        document.getElementById('directAnswerSection').style.display = 'none';
        loadExams();
      } else {
        throw new Error(data.message || "Erreur lors de l'ajout");
      }
    } catch (err) {
      console.error("Erreur ajout question:", err);
      showToast(err.message || "Erreur lors de l'ajout", 'error');
    }
  });

  
  async function loadExams() {
    try {
      const response = await fetch('http://localhost:5000/api/teacher/my-exams-with-questions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const exams = await response.json();
      examsContainer.innerHTML = '';

      if (!Array.isArray(exams) || exams.length === 0) {
        examsContainer.innerHTML = '<p class="no-exams">Aucun examen créé pour l\'instant.</p>';
        return;
      }

      exams.forEach(exam => {
        const examDiv = document.createElement('div');
        examDiv.classList.add('exam-item');
        examDiv.innerHTML = `
          <div class="exam-header">
            <h3>${exam.title}</h3>
            <div class="exam-actions">
              <button onclick="fetchExamResults('${exam._id}')" class="btn-results">
                <i class="fas fa-chart-bar"></i> Résultats
              </button>
              <button onclick="deleteExam('${exam._id}')" class="btn-delete">
                <i class="fas fa-trash"></i> Supprimer
              </button>
            </div>
          </div>
          <p class="exam-description">${exam.description}</p>
          <div class="exam-meta">
            <span class="exam-public">Public : ${exam.publicCible}</span>
            <span class="exam-link">Lien : <a href="${exam.examLink}" target="_blank">${exam.examLink}</a></span>
          </div>
          <div class="question-list">
            <h4>Questions (${exam.questions?.length || 0})</h4>
            ${exam.questions?.length > 0 ? exam.questions.map(q => `
              <div class="question-item">
                <div class="question-content">
                  <p class="question-text"><strong>Q:</strong> ${q.text}</p>
                  ${q.type === 'qcm' ? `
                    <ul class="qcm-options">
                      ${q.options.map((opt, i) => `
                        <li class="${opt.isCorrect ? 'correct-option' : ''}">
                          ${String.fromCharCode(65 + i)}: ${opt.optionText}
                        </li>`).join('')}
                    </ul>` : `
                    <div class="direct-answer">
                      <p><strong>Réponse:</strong> ${q.reponseDirecte}</p>
                      <p><strong>Tolérance:</strong> ${q.tolerance}%</p>
                    </div>`}
                </div>
                <div class="question-meta">
                  <span>Note: ${q.note}</span>
                  <span>Durée: ${q.duree}s</span>
                  <button onclick="deleteQuestion('${q._id}', '${exam._id}')" class="btn-small">
                    <i class="fas fa-times"></i> Supprimer
                  </button>
                </div>
              </div>`).join('') : '<p class="no-questions">Aucune question ajoutée.</p>'}
          </div>
        `;
        examsContainer.appendChild(examDiv);
      });

    } catch (error) {
      console.error('Erreur chargement examens:', error);
      examsContainer.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Erreur lors du chargement des examens</p>
        </div>
      `;
    }
  }


  async function populateExamSelect() {
    try {
      const response = await fetch('http://localhost:5000/api/teacher/my-exams', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const exams = await response.json();
      examSelect.innerHTML = '<option value="">-- Sélectionner un examen --</option>';

      if (Array.isArray(exams)) {
        exams.forEach(exam => {
          const option = document.createElement('option');
          option.value = exam._id;
          option.textContent = exam.title;
          examSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Erreur chargement examens:', error);
    }
  }

  
  menuIcon.addEventListener("click", () => {
    navList.classList.toggle("show");
  });


  window.logout = function() {
    localStorage.removeItem("token");
    window.location.href = "connexion.html";
  };


  window.fetchExamResults = async function(examId) {
    try {
      const response = await fetch(`http://localhost:5000/api/teacher/exam-results/${examId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const results = await response.json();
      const list = document.getElementById('results-list');
      list.innerHTML = '';

      if (!Array.isArray(results) || results.length === 0) {
        list.innerHTML = '<li class="no-results"><i class="fas fa-info-circle"></i> Aucun résultat disponible</li>';
      } else {
        results.forEach(r => {
          const li = document.createElement('li');
          li.className = 'result-item';
          
          const studentInfo = r.student || {};
          const location = r.location || {};
          
          li.innerHTML = `
            <div class="student-info">
              <div class="student-name">${studentInfo.fullName || 'Anonyme'}</div>
              <div class="student-email">${studentInfo.email || ''}</div>
              <div class="student-score ${r.score > 50 ? 'high-score' : 'low-score'}">
                Score: ${r.score !== undefined ? r.score + ' pts' : '--'}
              </div>
            </div>
            <div class="location-info">
              <i class="fas fa-map-marker-alt"></i>
              ${location.latitude ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Non localisé'}
            </div>
          `;
          list.appendChild(li);
        });
      }

      document.getElementById('exam-results-section').style.display = 'block';
    } catch (err) {
      console.error('Erreur chargement résultats:', err);
      const list = document.getElementById('results-list');
      list.innerHTML = '<li class="error"><i class="fas fa-exclamation-circle"></i> Erreur de chargement</li>';
      document.getElementById('exam-results-section').style.display = 'block';
    }
  };


  window.deleteQuestion = async function(questionId, examId) {
    if (!confirm("Supprimer cette question ? Cette action est irréversible.")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/teacher/delete-question/${questionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Question supprimée", 'success');
        loadExams();
      } else {
        throw new Error(data.message || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
      showToast(error.message || "Erreur serveur", 'error');
    }
  };


  window.deleteExam = async function(examId) {
    if (!confirm("Supprimer cet examen et toutes ses questions ? Cette action est irréversible.")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/teacher/delete-exam/${examId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Échec de la suppression");
      }

      showToast("Examen supprimé avec succès", 'success');
      loadExams();
      populateExamSelect();

    } catch (error) {
      console.error("Erreur suppression examen:", error);
      showToast(`Erreur: ${error.message || "Échec de la suppression"}`, 'error');
    }
  };


  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  }

 
  loadExams();
  populateExamSelect();
  toggleQuestionType();
});
