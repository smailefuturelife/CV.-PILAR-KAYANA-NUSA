console.log("auth.js loaded");

async function login() {
  console.log("LOGIN DIKLIK");

  const supabase = window.supabaseClient;

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("error");

  errorEl.innerText = "";

  if (!email || !password) {
    errorEl.innerText = "Isi email & password!";
    return;
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    console.log("HASIL:", data, error);

    if (error) {
      errorEl.innerText = error.message;
    } else {
      alert("Login berhasil!");
      window.location.href = "dashboard.html"; // ✅ FIX DI SINI
    }

  } catch (err) {
    console.error(err);
    errorEl.innerText = "Terjadi error!";
  }
}