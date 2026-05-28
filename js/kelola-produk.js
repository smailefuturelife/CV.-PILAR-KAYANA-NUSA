let semuaProduk = [];
let tambahModal;
let editModal;
let previewModal;
let fotoPreview = [];
let indexPreview = 0;
let produkPreviewId = null;

document.addEventListener("DOMContentLoaded", function () {
  tambahModal = new bootstrap.Modal(document.getElementById("tambahModal"));
  editModal = new bootstrap.Modal(document.getElementById("editModal"));
  previewModal = new bootstrap.Modal(document.getElementById("previewModal"));

  getProducts();
});

function ambilSemuaFoto(gambar) {
  if (Array.isArray(gambar)) {
    return gambar;
  }

  if (typeof gambar === "string") {
    try {
      const hasil = JSON.parse(gambar);
      if (Array.isArray(hasil)) {
        return hasil;
      }
      return [gambar];
    } catch (e) {
      return [gambar];
    }
  }

  return [];
}

function ambilFotoUtama(gambar) {
  const foto = ambilSemuaFoto(gambar);
  return foto[0] || "";
}

function tampilkanPreview(index) {
  if (fotoPreview.length === 0) return;

  indexPreview = index;

  if (indexPreview < 0) {
    indexPreview = fotoPreview.length - 1;
  }

  if (indexPreview >= fotoPreview.length) {
    indexPreview = 0;
  }

  document.getElementById("previewBesar").src = fotoPreview[indexPreview];

  let thumbs = "";

  fotoPreview.forEach(function (url, index) {
    thumbs += `
      <img
        src="${url}"
        onclick="tampilkanPreview(${index})"
        style="
          width:75px;
          height:75px;
          object-fit:cover;
          border-radius:10px;
          cursor:pointer;
          border:3px solid ${index === indexPreview ? "#0d6efd" : "#ffffff"};
        "
      >
    `;
  });

  document.getElementById("previewThumbs").innerHTML = thumbs;
  document.getElementById("previewCounter").innerText =
    `${indexPreview + 1} / ${fotoPreview.length}`;
}

function bukaPreviewProduk(id, indexAwal = 0) {
  const produk = semuaProduk.find(function (item) {
    return item.id === id;
  });

  if (!produk) return;

  produkPreviewId = id;
  fotoPreview = ambilSemuaFoto(produk.gambar);

  if (fotoPreview.length === 0) {
    alert("Produk ini belum punya gambar.");
    return;
  }

  tampilkanPreview(indexAwal);
  previewModal.show();
}

function geserPreview(arah) {
  tampilkanPreview(indexPreview + arah);
}

async function uploadBanyakGambar(files) {
  const client = window.supabaseClient;
  let urls = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      alert("File harus berupa gambar.");
      return null;
    }

    const fileName = Date.now() + "-" + Math.random() + "-" + file.name;

    const { error: uploadError } = await client
      .storage
      .from("produk-images")
      .upload(fileName, file);

    if (uploadError) {
      alert("Gagal upload gambar: " + uploadError.message);
      return null;
    }

    const { data: publicData } = client
      .storage
      .from("produk-images")
      .getPublicUrl(fileName);

    urls.push(publicData.publicUrl);
  }

  return urls;
}

async function tambahProduk() {
  const client = window.supabaseClient;

  const nama = document.getElementById("nama").value.trim();
  const kode = document.getElementById("kode").value.trim();
  const harga = document.getElementById("harga").value;
  const kategori = document.getElementById("kategori").value.trim();
  const stok = document.getElementById("stok").value;
  const deskripsi = document.getElementById("deskripsi").value.trim();
  const files = document.getElementById("gambar").files;

  if (!nama || !kode || !harga || !kategori || !stok || !deskripsi || files.length === 0) {
    alert("Isi semua data dan pilih minimal 1 gambar!");
    return;
  }

  const gambarUrls = await uploadBanyakGambar(files);

  if (!gambarUrls) return;

  const { error } = await client
    .from("products")
    .insert([
      {
        nama_produk: nama,
        kode_barang: kode,
        harga: Number(harga),
        kategori: kategori,
        stok: Number(stok),
        deskripsi: deskripsi,
        gambar: gambarUrls
      }
    ]);

  if (error) {
    alert(error.message);
  } else {
    alert("Produk berhasil ditambahkan");

    document.getElementById("nama").value = "";
    document.getElementById("kode").value = "";
    document.getElementById("harga").value = "";
    document.getElementById("kategori").value = "";
    document.getElementById("stok").value = "";
    document.getElementById("deskripsi").value = "";
    document.getElementById("gambar").value = "";

    tambahModal.hide();
    getProducts();
  }
}

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
    const fotoUtama = ambilFotoUtama(item.gambar);
    const jumlahFoto = ambilSemuaFoto(item.gambar).length;

    html += `
      <div class="col-md-3 mb-3">
        <div class="card shadow-sm h-100">

          <div style="position:relative;">
            <img
              src="${fotoUtama}"
              onclick="bukaPreviewProduk(${item.id}, 0)"
              class="card-img-top"
              style="height:180px; object-fit:cover; cursor:pointer;"
            >

            <span
              class="badge bg-dark"
              style="position:absolute; right:10px; bottom:10px;"
            >
              ${jumlahFoto} Foto
            </span>
          </div>

          <div class="card-body">

            <small class="text-muted">${item.kode_barang || "-"}</small>

            <h5 class="mt-2">
              ${item.nama_produk || "-"}
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

  const fotoUtama = ambilFotoUtama(produk.gambar);

  document.getElementById("edit_id").value = produk.id;
  document.getElementById("edit_nama").value = produk.nama_produk || "";
  document.getElementById("edit_kode").value = produk.kode_barang || "";
  document.getElementById("edit_harga").value = produk.harga || "";
  document.getElementById("edit_kategori").value = produk.kategori || "";
  document.getElementById("edit_stok").value = produk.stok || "";
  document.getElementById("edit_deskripsi").value = produk.deskripsi || "";
  document.getElementById("edit_gambar").value = "";
  document.getElementById("edit_preview").src = fotoUtama;

  document.getElementById("edit_preview").style.cursor = "pointer";
  document.getElementById("edit_preview").onclick = function () {
    bukaPreviewProduk(produk.id, 0);
  };

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
  const files = document.getElementById("edit_gambar").files;

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

  if (files.length > 0) {
    const gambarUrls = await uploadBanyakGambar(files);

    if (!gambarUrls) return;

    updateData.gambar = gambarUrls;
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

function jadikanFotoUtama() {
  if (fotoPreview.length === 0) return;

  const fotoDipilih = fotoPreview[indexPreview];

  fotoPreview.splice(indexPreview, 1);
  fotoPreview.unshift(fotoDipilih);

  tampilkanPreview(0);
}

function geserUrutanFoto(arah) {
  const indexBaru = indexPreview + arah;

  if (indexBaru < 0 || indexBaru >= fotoPreview.length) return;

  const sementara = fotoPreview[indexPreview];
  fotoPreview[indexPreview] = fotoPreview[indexBaru];
  fotoPreview[indexBaru] = sementara;

  tampilkanPreview(indexBaru);
}

async function simpanUrutanFoto() {
  const client = window.supabaseClient;

  if (!produkPreviewId) {
    alert("Produk tidak ditemukan.");
    return;
  }

  const { error } = await client
    .from("products")
    .update({
      gambar: fotoPreview
    })
    .eq("id", produkPreviewId);

  if (error) {
    alert("Gagal simpan urutan gambar: " + error.message);
    return;
  }

  alert("Urutan gambar berhasil disimpan.");

  previewModal.hide();
  getProducts();
}

function ambilPathStorageDariUrl(url) {
  if (!url) return null;

  const marker = "/produk-images/";
  const index = url.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(url.substring(index + marker.length));
}

async function hapusProduk(id) {
  const client = window.supabaseClient;

  if (!confirm("Yakin hapus produk? Gambar di storage juga akan dihapus.")) return;

  const produk = semuaProduk.find(function (item) {
    return item.id === id;
  });

  if (!produk) {
    alert("Produk tidak ditemukan.");
    return;
  }

  const daftarFoto = ambilSemuaFoto(produk.gambar);

  const daftarPath = daftarFoto
    .map(function (url) {
      return ambilPathStorageDariUrl(url);
    })
    .filter(function (path) {
      return path !== null;
    });

  if (daftarPath.length > 0) {
    const { error: storageError } = await client
      .storage
      .from("produk-images")
      .remove(daftarPath);

    if (storageError) {
      alert("Gagal hapus gambar storage: " + storageError.message);
      return;
    }
  }

  const { error } = await client
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Gagal hapus produk: " + error.message);
    return;
  }

  alert("Produk dan gambar berhasil dihapus.");
  getProducts();
}
