const menuIcon = document.getElementById("toggleMenu");
const navList = document.querySelector("nav ul");

menuIcon.addEventListener("click", () => {
    navList.classList.toggle("show");
});