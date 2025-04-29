const createExamForm = document.getElementById('createExamForm');
const examsContainer = document.getElementById('examsContainer');

const token = localStorage.getItem('token');

if (!token) {
    window.location.href = "connexion.html";
}

createExamForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const publicCible = document.getElementById('publicCible').value;

    try {
        const response = await fetch('http://localhost:5000/api/teacher/create-exam', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
        body: JSON.stringify({ title, description, publicCible })
    });

    const data = await response.json();

    if (response.ok) {
        alert('Examen créé avec succès !');
        createExamForm.reset();
        loadExams();
    } else {
        alert(data.message || 'Erreur lors de la création de l\'examen');
    }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la connexion au serveur');
    }
});

async function loadExams() {
  try {
    const response = await fetch('http://localhost:5000/api/teacher/my-exams', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    examsContainer.innerHTML = '';

    if (data.length === 0) {
      examsContainer.innerHTML = '<p>Aucun examen créé pour l\'instant.</p>';
      return;
    }

    data.forEach(exam => {
      const examDiv = document.createElement('div');
      examDiv.classList.add('exam-item');
      examDiv.innerHTML = `
        <h3>${exam.title}</h3>
        <p>${exam.description}</p>
        <small>Public : ${exam.publicCible}</small><br>
        <small>Lien d'examen : <code>${exam.examLink}</code></small>
      `;
      examsContainer.appendChild(examDiv);
    });
  } catch (error) {
    console.error('Erreur lors du chargement des examens:', error);
  }
}

window.addEventListener('load', loadExams);

const menuIcon = document.getElementById("toggleMenu");
const navList = document.querySelector("nav ul");

menuIcon.addEventListener("click", () => {
    navList.classList.toggle("show");
});

function logout() {
    localStorage.removeItem("token");
    window.location.href = "connexion.html";
}