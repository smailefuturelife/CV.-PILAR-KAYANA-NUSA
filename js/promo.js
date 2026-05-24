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
    console.error(error);
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

loadPromo();