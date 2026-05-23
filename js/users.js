async function loadUsers() {
  const { data } = await supabase.from("users").select("*");

  let html = "";
  data.forEach(u => {
    html += `<p>${u.email}</p>`;
  });

  document.getElementById("users").innerHTML = html;
}