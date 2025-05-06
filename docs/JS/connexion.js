const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            alert("Connexion réussie !");
            localStorage.setItem("token", data.token);

            if (data.user.role === "teacher") {
                window.location.href = "enseignant.html";
            } else {
                // ✅ Rediriger automatiquement avec le lien d'examen dans l'URL
                const examLink = "d415e42e-dc2f-4ca0-9201-365ae183451c";
                window.location.href = `Espace_etudiant.html?exam=${examLink}`;
            }
        } else {
            alert(data.message || "Identifiants invalides.");
        }
    } catch (error) {
        console.error("Erreur de connexion :", error);
        alert("Erreur lors de la connexion au serveur.");
    }
});
