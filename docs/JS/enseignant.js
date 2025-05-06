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

  window.toggleQuestionType = function () {
    const type = document.getElementById('questionType').value;
    const qcmDiv = document.getElementById('qcmOptions');
    const directDiv = document.getElementById('directAnswerSection');

    qcmDiv.style.display = type === 'qcm' ? 'block' : 'none';
    directDiv.style.display = type === 'directe' ? 'block' : 'none';
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
        alert("Examen créé avec succès !");
        createExamForm.reset();
        loadExams();
        populateExamSelect();
      } else {
        alert(data.message || "Erreur lors de la création de l'examen.");
      }
    } catch (err) {
      console.error("Erreur création examen:", err);
      alert("Erreur lors de la connexion au serveur.");
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

      const options = ['A', 'B', 'C', 'D'];
      options.forEach(opt => {
        const text = document.getElementById('option' + opt).value;
        const isChecked = document.getElementById('correct' + opt).checked;
        payload.qcmOptions.push({
          optionText: text,
          isCorrect: isChecked
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
        alert("Question ajoutée avec succès !");
        addQuestionForm.reset();
        document.getElementById('qcmOptions').style.display = 'none';
        document.getElementById('directAnswerSection').style.display = 'none';
        loadExams();
      } else {
        alert(data.message || "Erreur lors de l'ajout de la question.");
      }

    } catch (err) {
      console.error("Erreur ajout question:", err);
      alert("Erreur lors de la connexion au serveur.");
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
        examsContainer.innerHTML = '<p>Aucun examen créé pour l\'instant.</p>';
        return;
      }

      exams.forEach(exam => {
        const examDiv = document.createElement('div');
        examDiv.classList.add('exam-item');
        examDiv.innerHTML = `
          <h3>${exam.title}</h3>
          <p>${exam.description}</p>
          <small>Public : ${exam.publicCible}</small><br>
          <small>Lien d'examen : <code>${exam.examLink}</code></small>
          <div class="question-list">
            <h4>Questions ajoutées :</h4>
            ${exam.questions && exam.questions.length > 0 ? exam.questions.map(q => `
              <div class="question-item">
                <p><strong>Q:</strong> ${q.text}</p>
                ${q.type === 'qcm' ? `
                  <ul>
                    ${q.options.map((opt, i) => `<li>${String.fromCharCode(65 + i)}: ${opt.optionText}</li>`).join('')}
                  </ul>
                  <p><strong>Bonnes réponses:</strong> ${q.options.filter(opt => opt.isCorrect).map((_, i) => String.fromCharCode(65 + i)).join(', ')}</p>` :
                  `<p><strong>Réponse attendue:</strong> ${q.reponseDirecte}</p>
                   <p><strong>Tolérance:</strong> ${q.tolerance}%</p>`}
                <p><strong>Note:</strong> ${q.note} - <strong>Durée:</strong> ${q.duree} secondes</p>
                <button onclick="deleteQuestion('${q._id}', '${exam._id}')">Supprimer la question</button>
              </div>
            `).join('') : '<p>Aucune question ajoutée.</p>'}
          </div>
          <button onclick="fetchExamResults('${exam._id}')">Afficher les résultats</button>
        `;
        examsContainer.appendChild(examDiv);
      });

    } catch (error) {
      console.error('Erreur lors du chargement des examens:', error);
    }
  }

  async function populateExamSelect() {
    try {
      const response = await fetch('http://localhost:5000/api/teacher/my-exams', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const exams = await response.json();
      examSelect.innerHTML = '<option value="">--Sélectionner un examen--</option>';

      if (!Array.isArray(exams)) return;

      exams.forEach(exam => {
        const option = document.createElement('option');
        option.value = exam._id;
        option.textContent = exam.title;
        examSelect.appendChild(option);
      });

    } catch (error) {
      console.error('Erreur lors du chargement des examens:', error);
    }
  }

  menuIcon.addEventListener("click", () => {
    navList.classList.toggle("show");
  });

  window.logout = function () {
    localStorage.removeItem("token");
    window.location.href = "connexion.html";
  };

  window.fetchExamResults = async function (examId) {
    try {
      const response = await fetch(`http://localhost:5000/api/teacher/exam-results/${examId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const results = await response.json();
      const list = document.getElementById('results-list');
      list.innerHTML = '';

      results.forEach(r => {
        const li = document.createElement('li');
        li.textContent = `${r.student.fullName} - ${r.score} points (${r.location?.latitude}, ${r.location?.longitude})`;
        list.appendChild(li);
      });

      document.getElementById('exam-results-section').style.display = 'block';
    } catch (err) {
      console.error('Erreur lors du chargement des résultats', err);
    }
  };

  window.deleteQuestion = async function (questionId, examId) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette question ?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/teacher/delete-question/${questionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();

      if (res.ok) {
        alert("Question supprimée.");
        loadExams();
      } else {
        alert(data.message || "Erreur lors de la suppression.");
      }

    } catch (error) {
      console.error("Erreur suppression:", error);
      alert("Erreur serveur.");
    }
  };

  // Initial load
  loadExams();
  populateExamSelect();
});
