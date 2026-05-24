let semuaProduk = [];
let editModal;

document.addEventListener("DOMContentLoaded", function () {
  editModal = new bootstrap.Modal(document.getElementById("editModal"));
  getProducts();
});

async function getProducts() {
  const client = window.supabaseClient;
  const list = document.getElementById("list");

  if (!client) {
    list.innerHTML = "Supabase belum terhubung.";
    return;
  }

  const { data, error } = await client
    .from("products")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    list.innerHTML = error.message;
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = "Belum ada produk";
    return;
  }

  semuaProduk = data;

  let html = "";

  data.forEach(function (item) {
    html += `
      <div class="col-md-3 mb-3">
        <div class="card shadow-sm h-100">

          <img
            src="${item.gambar || ''}"
            class="card-img-top"
            style="height:180px; object-fit:cover;"
          >

          <div class="card-body">

            <small class="text-muted">${item.kode_barang || '-'}</small>

            <h5 class="mt-2">
              ${item.nama_produk || '-'}
            </h5>

            <p class="text-muted mb-1">
              Stok: ${item.stok || 0}
            </p>

            <p class="text-success fw-bold">
              Rp ${Number(item.harga || 0).toLocaleString("id-ID")}
            </p>

            <div class="d-flex gap-2">
              <button
                class="btn btn-warning btn-sm w-50"
                onclick="bukaEditProduk(${item.id})"
              >
                Ubah
              </button>

              <button
                class="btn btn-danger btn-sm w-50"
                onclick="hapusProduk(${item.id})"
              >
                Hapus
              </button>
            </div>

          </div>

        </div>
      </div>
    `;
  });

  list.innerHTML = html;
}

function bukaEditProduk(id) {
  const produk = semuaProduk.find(function (item) {
    return item.id === id;
  });

  if (!produk) {
    alert("Produk tidak ditemukan.");
    return;
  }

  document.getElementById("edit_id").value = produk.id;
  document.getElementById("edit_nama").value = produk.nama_produk || "";
  document.getElementById("edit_kode").value = produk.kode_barang || "";
  document.getElementById("edit_harga").value = produk.harga || "";
  document.getElementById("edit_kategori").value = produk.kategori || "";
  document.getElementById("edit_stok").value = produk.stok || "";
  document.getElementById("edit_deskripsi").value = produk.deskripsi || "";
  document.getElementById("edit_gambar").value = "";
  document.getElementById("edit_preview").src = produk.gambar || "";

  editModal.show();
}

async function simpanEditProduk() {
  const client = window.supabaseClient;

  const id = document.getElementById("edit_id").value;
  const nama = document.getElementById("edit_nama").value.trim();
  const kode = document.getElementById("edit_kode").value.trim();
  const harga = document.getElementById("edit_harga").value;
  const kategori = document.getElementById("edit_kategori").value.trim();
  const stok = document.getElementById("edit_stok").value;
  const deskripsi = document.getElementById("edit_deskripsi").value.trim();
  const file = document.getElementById("edit_gambar").files[0];

  if (!nama || !kode || !harga || !kategori || !stok || !deskripsi) {
    alert("Semua data wajib diisi.");
    return;
  }

  let updateData = {
    nama_produk: nama,
    kode_barang: kode,
    harga: Number(harga),
    kategori: kategori,
    stok: Number(stok),
    deskripsi: deskripsi
  };

  if (file) {
    if (file.type !== "image/jpeg") {
      alert("Gambar harus JPG.");
      return;
    }

    const fileName = Date.now() + "-" + file.name;

    const { error: uploadError } = await client
      .storage
      .from("produk-images")
      .upload(fileName, file);

    if (uploadError) {
      alert("Gagal upload gambar: " + uploadError.message);
      return;
    }

    const { data: publicData } = client
      .storage
      .from("produk-images")
      .getPublicUrl(fileName);

    updateData.gambar = publicData.publicUrl;
  }

  const { error } = await client
    .from("products")
    .update(updateData)
    .eq("id", Number(id));

  if (error) {
    alert("Gagal ubah produk: " + error.message);
    return;
  }

  alert("Produk berhasil diubah.");

  editModal.hide();
  getProducts();
}

async function hapusProduk(id) {
  const client = window.supabaseClient;

  if (!confirm("Yakin hapus produk?")) return;

  const { error } = await client
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Gagal hapus produk: " + error.message);
    return;
  }

  alert("Produk berhasil dihapus.");
  getProducts();
}