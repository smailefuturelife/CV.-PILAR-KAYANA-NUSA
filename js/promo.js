let semuaProduk = [];
let tambahPromoModal;

document.addEventListener("DOMContentLoaded", function () {
  tambahPromoModal = new bootstrap.Modal(document.getElementById("tambahPromoModal"));

  loadProdukUntukPromo();
  loadPromo();

  document.getElementById("product").addEventListener("change", tampilPreviewProduk);
  document.getElementById("promoForm").addEventListener("submit", simpanPromo);
});

async function loadProdukUntukPromo() {
  const client = window.supabaseClient;
  const productSelect = document.getElementById("product");

  const { data, error } = await client
    .from("products")
    .select("id, nama_produk, gambar")
    .order("nama_produk", { ascending: true });

  if (error) {
    alert("Gagal mengambil produk: " + error.message);
    return;
  }

  semuaProduk = data || [];

  productSelect.innerHTML = `<option value="">-- Pilih Produk --</option>`;

  semuaProduk.forEach(function (item) {
    productSelect.innerHTML += `
      <option value="${item.id}">
        ${item.nama_produk}
      </option>
    `;
  });
}

function tampilPreviewProduk() {
  const productId = document.getElementById("product").value;
  const preview = document.getElementById("preview");

  const produk = semuaProduk.find(function (item) {
    return String(item.id) === String(productId);
  });

  if (produk && produk.gambar) {
    preview.src = produk.gambar;
    preview.style.display = "block";
  } else {
    preview.src = "";
    preview.style.display = "none";
  }
}

async function simpanPromo(event) {
  event.preventDefault();

  const client = window.supabaseClient;

  const product_id = document.getElementById("product").value;
  const discount = document.getElementById("discount").value;
  const min_purchase = document.getElementById("min_purchase").value;
  const start_date = document.getElementById("start_date").value;
  const end_date = document.getElementById("end_date").value;

  if (!product_id || !discount || !min_purchase || !start_date || !end_date) {
    alert("Semua data promo wajib diisi.");
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
    return;
  }

  alert("Promo berhasil ditambahkan.");

  document.getElementById("promoForm").reset();
  document.getElementById("preview").style.display = "none";

  tambahPromoModal.hide();
  loadPromo();
}

async function loadPromo() {
  const tbody = document.getElementById("promoTable");
  const client = window.supabaseClient;

  if (!client) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-danger text-center">
          Supabase belum terhubung. Cek file js/supabase.js
        </td>
      </tr>
    `;
    return;
  }

  const { data, error } = await client
    .from("promotions")
    .select(`
      id,
      discount,
      min_purchase,
      start_date,
      end_date,
      products (
        nama_produk,
        gambar
      )
    `)
    .order("start_date", { ascending: false });

  if (error) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-danger text-center">
          Gagal mengambil data promo: ${error.message}
        </td>
      </tr>
    `;
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center">
          Belum ada promo
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = "";

  data.forEach((item, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${item.products ? item.products.nama_produk : "-"}</td>
        <td>
          ${
            item.products && item.products.gambar
              ? `<img src="${item.products.gambar}" width="80" height="80" style="object-fit:cover;border-radius:12px;">`
              : "-"
          }
        </td>
        <td>${item.discount}%</td>
        <td>Rp ${Number(item.min_purchase || 0).toLocaleString("id-ID")}</td>
        <td>${item.start_date}</td>
        <td>${item.end_date}</td>
        <td>
          <button onclick="hapusPromo('${item.id}')" class="btn btn-danger btn-sm">
            Hapus
          </button>
        </td>
      </tr>
    `;
  });
}

async function hapusPromo(id) {
  if (!confirm("Yakin hapus promo ini?")) return;

  const client = window.supabaseClient;

  const { error } = await client
    .from("promotions")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Gagal hapus promo: " + error.message);
    return;
  }

  alert("Promo berhasil dihapus");
  loadPromo();
}