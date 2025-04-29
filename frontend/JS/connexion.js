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
                window.location.href = "etudiant.html";
            }
        } else {
            alert(data.message || "Identifiants invalides.");
        }
    } catch (error) {
        console.error("Erreur de connexion :", error);
        alert("Erreur lors de la connexion au serveur.");
    }
});
