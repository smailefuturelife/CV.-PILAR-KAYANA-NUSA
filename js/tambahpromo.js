const productSelect = document.getElementById("product");
const preview = document.getElementById("preview");
const promoForm = document.getElementById("promoForm");

async function loadProducts() {
  const client = window.supabaseClient;

  if (!client) {
    alert("Supabase belum terhubung. Cek file js/supabase.js");
    return;
  }

  const { data, error } = await client
    .from("products")
    .select("id, nama_produk, harga, gambar")
    .order("nama_produk", { ascending: true });

  if (error) {
    alert("Gagal mengambil produk: " + error.message);
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    productSelect.innerHTML = `
      <option value="">Belum ada produk</option>
    `;
    return;
  }

  data.forEach(function(item) {
    const option = document.createElement("option");

    option.value = item.id;
    option.textContent =
      item.nama_produk +
      " - Rp " +
      Number(item.harga).toLocaleString("id-ID");

    option.dataset.image = item.gambar || "";

    productSelect.appendChild(option);
  });
}

productSelect.addEventListener("change", function() {
  const selected = productSelect.options[productSelect.selectedIndex];
  const image = selected.dataset.image;

  if (image) {
    preview.src = image;
    preview.style.display = "block";
  } else {
    preview.src = "";
    preview.style.display = "none";
  }
});

promoForm.addEventListener("submit", async function(e) {
  e.preventDefault();

  const client = window.supabaseClient;

  if (!client) {
    alert("Supabase belum terhubung. Cek file js/supabase.js");
    return;
  }

  const product_id = document.getElementById("product").value;
  const discount = document.getElementById("discount").value;
  const min_purchase = document.getElementById("min_purchase").value;
  const start_date = document.getElementById("start_date").value;
  const end_date = document.getElementById("end_date").value;

  if (!product_id || !discount || !min_purchase || !start_date || !end_date) {
    alert("Semua data wajib diisi!");
    return;
  }

  if (Number(discount) <= 0 || Number(discount) > 100) {
    alert("Diskon harus antara 1 sampai 100!");
    return;
  }

  if (Number(min_purchase) < 0) {
    alert("Minimal pembelian tidak boleh minus!");
    return;
  }

  if (end_date < start_date) {
    alert("Tanggal selesai tidak boleh lebih kecil dari tanggal mulai!");
    return;
  }

  const { error } = await client
    .from("promotions")
    .insert([
      {
        product_id: Number(product_id),
        discount: Number(discount),
        min_purchase: Number(min_purchase),
        start_date: start_date,
        end_date: end_date
      }
    ]);

  if (error) {
    alert("Gagal tambah promo: " + error.message);
    console.error(error);
    return;
  }

  alert("Promo berhasil ditambahkan");

  promoForm.reset();
  preview.src = "";
  preview.style.display = "none";
});

loadProducts();