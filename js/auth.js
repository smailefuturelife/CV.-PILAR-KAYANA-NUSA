console.log("auth.js loaded");

async function login() {

  console.log("LOGIN DIKLIK");

  const supabase = window.supabaseClient;

  const email = document
    .getElementById("email")
    .value
    .trim();

  const password = document
    .getElementById("password")
    .value;

  const errorEl =
    document.getElementById("error");

  errorEl.innerText = "";

  if (!email || !password) {

    errorEl.innerText =
      "Isi email dan password!";

    return;

  }

  try {

    const { data, error } =
      await supabase

      .from("users")

      .select("*")

      .ilike("email", email)

      .eq("password", password)

      .eq("role", "admin");

    if (error) {

      errorEl.innerText =
        "Terjadi kesalahan.";

      return;

    }

    if (!data || data.length === 0) {

      errorEl.innerText =
        "Email atau password salah.";

      return;

    }

    localStorage.setItem(
      "adminLogin",
      JSON.stringify(data[0])
    );

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
