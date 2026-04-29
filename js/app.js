function toggleMenu() {
  document.querySelector(".sidebar").classList.toggle("active");
}

async function loadComponent(id, file) {
  const res = await fetch(file);
  const html = await res.text();
  document.getElementById(id).innerHTML = html;
}