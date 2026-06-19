console.log("auth.js loaded");

async function login() {

  console.log("LOGIN DIKLIK");

  const supabase = window.supabaseClient;

  const email = document.getElementById("email").value.trim();

  const password = document.getElementById("password").value;

  const errorEl = document.getElementById("error");

  // Reset pesan error
  errorEl.innerText = "";

  // Validasi input kosong
  if (!email || !password) {

    errorEl.innerText = "Isi email dan password!";

    return;
  }

  try {

    const { data, error } =
      await supabase.auth.signInWithPassword({

        email,

        password

      });

    console.log("HASIL:", data, error);

    if (error) {

      // Error login
      errorEl.innerText =
        "Email atau password salah.";

      return;
    }

    // Login berhasil
    alert("Login berhasil!");

    window.location.href =
      "dashboard.html";

  }

  catch (err) {

    console.error(err);

    errorEl.innerText =
      "Terjadi kesalahan.";

  }

}
