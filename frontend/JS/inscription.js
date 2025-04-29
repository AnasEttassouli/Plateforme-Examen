const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const name = `${firstName} ${lastName}`;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    try {
        const res = await fetch("http://localhost:5000/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name,
                email,
                password,
                role,
            }),
        });

        const data = await res.json();

        if (res.ok) {
            alert("Inscription réussie !");
            if (role === "teacher") {
                window.location.href = "enseignant.html";
            } else {
                window.location.href = "etudiant.html";
            }
        } else {
            alert(data.message || "Erreur lors de l'inscription.");
        }
    } catch (error) {
        console.error("Erreur:", error);
        alert("Erreur lors de la connexion au serveur.");
    }
});
