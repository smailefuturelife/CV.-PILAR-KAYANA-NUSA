let semuaOrder = [];
let promoMap = {};

function formatRupiah(angka) {
  return "Rp " + Number(angka || 0).toLocaleString("id-ID");
}

function statusBadge(status) {
  if (status === "Selesai") {
    return `<span class="badge bg-success">Selesai</span>`;
  }

  if (status === "Dibatalkan") {
    return `<span class="badge bg-danger">Dibatalkan</span>`;
  }

  return `<span class="badge bg-primary">${status || "Diproses"}</span>`;
}

function getSalesName(item) {
  return item.users?.nama || item.users?.email || item.sales_id || "-";
}

function getSalesCode(item) {
  return item.users?.user_code || "-";
}

function getOrderCode(item) {
  return item.order_code || item.id || "-";
}

async function loadOrder() {
  const client = window.supabaseClient;
  const tbody = document.getElementById("order");

  if (!client) {
    tbody.innerHTML = `
      <tr>
        <td colspan="14" class="text-danger text-center">
          Supabase belum terhubung
        </td>
      </tr>
    `;
    return;
  }

  const { data, error } = await client
    .from("orders")
    .select(`
      id,
      order_code,
      customer_name,
      phone,
      address,
      sales_id,
      status,
      payment_method,
      payment_proof,
      subtotal,
      discount_amount,
      total,
      promotion_id,
      created_at,
      users (
        nama,
        email,
        user_code
      ),
      order_items (
        qty,
        price,
        products (
          nama_produk,
          gambar,
          kategori
        ) 
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    tbody.innerHTML = `
      <tr>
        <td colspan="14" class="text-danger text-center">
          ${error.message}
        </td>
      </tr>
    `;
    console.error(error);
    return;
  }

  semuaOrder = data || [];

  const promoIds = semuaOrder
    .map((item) => item.promotion_id)
    .filter((id) => id);

  promoMap = {};

  if (promoIds.length > 0) {
    const { data: promoData, error: promoError } = await client
      .from("promotions")
      .select("id, discount, min_purchase")
      .in("id", promoIds);

    if (!promoError && promoData) {
      promoData.forEach((promo) => {
        promoMap[promo.id] = promo;
      });
    }
  }

  renderTable();
}

function renderTable() {
  const tbody = document.getElementById("order");

  const search = document
    .getElementById("searchCustomer")
    .value
    .toLowerCase();

  const statusFilter = document.getElementById("filterStatus").value;

  const filtered = semuaOrder.filter((item) => {
    const cocokCustomer = (item.customer_name || "")
      .toLowerCase()
      .includes(search);

    const cocokStatus =
      statusFilter === "" || item.status === statusFilter;

    return cocokCustomer && cocokStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="14" class="text-center">Belum ada order</td>
      </tr>
    `;
    return;
  }

  let html = "";

  filtered.forEach((item, index) => {
    const produk = item.order_items?.length
      ? item.order_items.map((x) => x.products?.nama_produk || "-").join(", ")
      : "-";

    const qty = item.order_items?.length
      ? item.order_items.map((x) => x.qty).join(", ")
      : "-";

    const subtotal = Number(item.subtotal || 0);
    const hemat = Number(item.discount_amount || 0);
    const total = Number(item.total || subtotal - hemat);

    const promo = item.promotion_id ? promoMap[item.promotion_id] : null;
    const diskonPersen = promo ? promo.discount : 0;

    html += `
      <tr>
        <td>${index + 1}</td>
        <td>${getOrderCode(item)}</td>
        <td>${item.customer_name || "-"}</td>
        <td>${getSalesName(item)}</td>
        <td>${item.phone || "-"}</td>
        <td>${produk}</td>
        <td>${qty}</td>
        <td>${formatRupiah(subtotal)}</td>
        <td>${diskonPersen || 0}%</td>
        <td class="text-success fw-bold">${formatRupiah(hemat)}</td>
        <td class="text-success fw-bold">${formatRupiah(total)}</td>
        <td>${item.payment_method || "-"}</td>
        <td>${statusBadge(item.status)}</td>
        <td>
          <button onclick="detailOrder('${item.id}')" class="btn btn-info btn-sm mb-1">
            Detail
          </button>

          <button onclick="updateStatus('${item.id}', 'Selesai')" class="btn btn-success btn-sm mb-1">
            Selesai
          </button>

          <button onclick="updateStatus('${item.id}', 'Dibatalkan')" class="btn btn-warning btn-sm mb-1">
            Batal
          </button>

          <button onclick="hapusOrder('${item.id}')" class="btn btn-danger btn-sm mb-1">
            Hapus
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function detailOrder(id) {
  const item = semuaOrder.find((x) => x.id === id);

  if (!item) return;

  const subtotal = Number(item.subtotal || 0);
  const hemat = Number(item.discount_amount || 0);
  const total = Number(item.total || subtotal - hemat);

  const promo = item.promotion_id ? promoMap[item.promotion_id] : null;
  const diskonPersen = promo ? promo.discount : 0;

  let produkHtml = "";

  if (item.order_items?.length > 0) {
    item.order_items.forEach((x, index) => {
      const harga = Number(x.price || 0);
      const qty = Number(x.qty || 0);
      const totalProduk = harga * qty;

      produkHtml += `
        <div class="border rounded p-3 mb-2">
          <div class="row">
            <div class="col-md-3">
              ${
                x.products?.gambar
                  ? `<img src="${x.products.gambar}" class="produk-img">`
                  : `<div class="bg-light rounded p-4 text-center">No Image</div>`
              }
            </div>

            <div class="col-md-9">
              <b>${index + 1}. ${x.products?.nama_produk || "-"}</b><br>
              Harga Satuan: ${formatRupiah(harga)}<br>
              Jumlah: ${qty}<br>
              Total Produk: ${formatRupiah(totalProduk)}
            </div>
          </div>
        </div>
      `;
    });
  } else {
    produkHtml = `<p class="text-muted">Tidak ada produk.</p>`;
  }

  const buktiHtml = item.payment_proof
    ? `
      <hr>
      <h6>Bukti Pembayaran</h6>
      <img src="${item.payment_proof}" class="payment-img">
      <br>
      <a href="${item.payment_proof}" target="_blank" class="btn btn-sm btn-dark mt-2">
        Buka Gambar
      </a>
    `
    : `
      <hr>
      <p class="text-muted">Belum ada bukti pembayaran.</p>
    `;

  const html = `
    <div class="d-flex justify-content-end mb-3">
      <button onclick="downloadInvoice('${item.id}')" class="btn btn-success">
        Download Invoice
      </button>
    </div>

    <h6>Data Customer</h6>

    <table class="table table-sm">
      <tr>
        <th>Kode Order</th>
        <td>${getOrderCode(item)}</td>
      </tr>

      <tr>
        <th>Nama</th>
        <td>${item.customer_name || "-"}</td>
      </tr>

      <tr>
        <th>No HP</th>
        <td>${item.phone || "-"}</td>
      </tr>

      <tr>
        <th>Alamat</th>
        <td>${item.address || "-"}</td>
      </tr>

      <tr>
        <th>Sales</th>
        <td>${getSalesName(item)}</td>
      </tr>

      <tr>
        <th>Kode Sales</th>
        <td>${getSalesCode(item)}</td>
      </tr>

      <tr>
        <th>Status</th>
        <td>${statusBadge(item.status)}</td>
      </tr>

      <tr>
        <th>Metode Pembayaran</th>
        <td>${item.payment_method || "-"}</td>
      </tr>
    </table>

    <hr>

    <h6>Produk</h6>
    ${produkHtml}

    <hr>

    <h6>Rincian Pembayaran</h6>

    <table class="table table-sm">
      <tr>
        <th>Subtotal</th>
        <td>${formatRupiah(subtotal)}</td>
      </tr>

      <tr>
        <th>Diskon</th>
        <td>${diskonPersen || 0}%</td>
      </tr>

      <tr>
        <th>Hemat</th>
        <td class="text-success fw-bold">${formatRupiah(hemat)}</td>
      </tr>

      <tr>
        <th>Potongan Harga</th>
        <td class="text-danger">-${formatRupiah(hemat)}</td>
      </tr>

      <tr>
        <th>Total Bayar</th>
        <td class="text-success fw-bold">${formatRupiah(total)}</td>
      </tr>
    </table>

    ${buktiHtml}
  `;

  document.getElementById("detailBody").innerHTML = html;

  const modal = new bootstrap.Modal(
    document.getElementById("detailModal")
  );

  modal.show();
}

function downloadInvoice(id) {
  const item = semuaOrder.find((x) => x.id === id);
  if (!item) return;

  const subtotal = Number(item.subtotal || 0);
  const hemat = Number(item.discount_amount || 0);
  const total = Number(item.total || subtotal - hemat);
  const promo = item.promotion_id ? promoMap[item.promotion_id] : null;
  const diskonPersen = promo ? promo.discount : 0;

  let produkRows = "";

  if (item.order_items?.length > 0) {
    item.order_items.forEach((x) => {
      const harga = Number(x.price || 0);
      const qty = Number(x.qty || 0);
      const totalProduk = harga * qty;

      produkRows += `
        <tr>
         <td>${x.products?.nama_produk || "-"}</td>
<td>${x.products?.kategori || "-"}</td>
<td>${qty}</td>
          <td>Pcs</td>
          <td>${formatRupiah(harga)}</td>
          <td>${formatRupiah(totalProduk)}</td>
        </tr>
      `;
    });
  }

  const invoiceHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Invoice ${getOrderCode(item)}</title>

<style>
  body {
    font-family: Arial, sans-serif;
    color: #111;
    padding: 35px;
    background: white;
  }

  .invoice {
    max-width: 900px;
    margin: auto;
  }

  .top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .logo-area {
    font-size: 22px;
    font-weight: bold;
  }

  .logo-area img {
    width: 90px;
    height: 90px;
    object-fit: contain;
    margin-bottom: 5px;
  }

  .invoice-title {
    font-size: 32px;
    font-weight: bold;
    text-align: right;
  }

  .info-wrap {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 30px;
    margin-top: 25px;
  }

  .info-title {
    font-weight: bold;
    margin-bottom: 8px;
  }

  .info-text {
    font-size: 14px;
    line-height: 1.6;
  }

  .right-info table {
    width: 100%;
    font-size: 14px;
  }

  .right-info td {
    padding: 4px 0;
  }

  .right-info td:first-child {
    font-weight: bold;
    width: 120px;
  }

  table.product {
    width: 100%;
    border-collapse: collapse;
    margin-top: 25px;
    font-size: 14px;
  }

  table.product th {
    border-bottom: 2px solid #111;
    border-top: 2px solid #111;
    padding: 8px;
    text-align: left;
  }

  table.product td {
    border-bottom: 1px solid #ccc;
    padding: 8px;
  }

  .summary {
    width: 330px;
    margin-left: auto;
    margin-top: 15px;
    font-size: 14px;
  }

  .summary table {
    width: 100%;
  }

  .summary td {
    padding: 5px 0;
  }

  .summary td:last-child {
    text-align: right;
    font-weight: bold;
  }

  .bank {
    margin-top: 25px;
    font-size: 14px;
    line-height: 1.7;
  }

  .note {
    margin-top: 20px;
    font-size: 13px;
    line-height: 1.7;
  }

  .signature {
    display: flex;
    justify-content: space-between;
    margin-top: 60px;
    text-align: center;
    font-size: 14px;
  }

  .company-footer {
    margin-top: 40px;
    font-size: 13px;
    line-height: 1.5;
  }

  .print-btn {
    padding: 10px 16px;
    margin-bottom: 20px;
    background: #111827;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  @media print {
    .print-btn {
      display: none;
    }

    body {
      padding: 20px;
    }
  }
</style>
</head>

<body>
<button class="print-btn" onclick="window.print()">Download / Cetak PDF</button>

<div class="invoice">

  <div class="top">
    <div class="logo-area">
      <img src="../icon.png">
      <div>CV Pilar Kayana Nusa</div>
    </div>

    <div class="invoice-title">
      Invoice
    </div>
  </div>

  <div class="info-wrap">
    <div>
      <div class="info-title">Kepada :</div>
      <div class="info-text">
        ${item.customer_name || "-"}<br>
        ${item.phone || "-"}<br>
        ${item.address || "-"}
      </div>
    </div>

    <div class="right-info">
      <table>
        <tr>
          <td>Nomor Invoice</td>
          <td>: ${getOrderCode(item)}</td>
        </tr>
        <tr>
          <td>Tanggal beli</td>
          <td>: ${
            item.created_at
              ? new Date(item.created_at).toLocaleDateString("id-ID")
              : "-"
          }</td>
        </tr>
        <tr>
  <td>Total</td>
  <td>: ${formatRupiah(total)}</td>
</tr>
<tr>
  <td>Status Order</td>
  <td>: ${item.status || "-"}</td>
</tr>
<tr>
  <td>Jatuh tempo</td>
  <td>: -</td>
</tr>
      </table>
    </div>
  </div>

  <table class="product">
    <thead>
      <tr>
        <th>Deskripsi</th>
        <th>Kategori</th>
        <th>Qty</th>
        <th>Satuan</th>
        <th>Harga</th>
        <th>Total Harga</th>
      </tr>
    </thead>
    <tbody>
      ${produkRows}
    </tbody>
  </table>

  <div class="summary">
    <table>
      <tr>
        <td>Subtotal</td>
        <td>${formatRupiah(subtotal)}</td>
      </tr>
      <tr>
        <td>Diskon ${diskonPersen || 0}%</td>
        <td>-${formatRupiah(hemat)}</td>
      </tr>
      <tr>
        <td>Total</td>
        <td>${formatRupiah(total)}</td>
      </tr>
    </table>
  </div>

  <div class="bank">
    <b>Pembayaran via Bank :</b><br><br>
    <b>Pembayaran Hanya kepada :</b><br>
    2480581388 / BCA Atas nama : Muhammad Mustaghfirin<br>
    1010011557376 / MANDIRI Atas nama : Muhammad Mustaghfirin
  </div>

  <div class="note">
    * Barang yang sudah dibeli tidak dapat dikembalikan<br>
    * Pengaplikasian media tidak sesuai dengan ketentuan kami, diluar tanggung jawab kami<br>
    * Garansi berlaku jika berat barang tidak sesuai dengan netto / bruto kami
  </div>

  <div class="signature">
    <div>
      Diterima oleh<br><br><br><br>
      (_____________)
    </div>

    <div>
      Hormat Kami<br><br><br><br>
      (_____________)
    </div>
  </div>

  <div class="company-footer">
    <b>CV Pilar Kayana Nusa</b><br>
    Tangerang, Indonesia<br>
    Sales: ${getSalesName(item)} (${getSalesCode(item)})
  </div>

</div>
</body>
</html>
  `;

  const win = window.open("", "_blank");
  win.document.write(invoiceHtml);
  win.document.close();

  setTimeout(() => {
    win.print();
  }, 500);
}

async function updateStatus(id, status) {
  const client = window.supabaseClient;

  if (!confirm("Update status order menjadi " + status + "?")) return;

  const { error } = await client
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (error) {
    alert("Gagal update status: " + error.message);
    return;
  }

  alert("Status berhasil diupdate");

  loadOrder();
}

async function hapusOrder(id) {
  const client = window.supabaseClient;

  if (!confirm("Yakin hapus order ini?")) return;

  await client
    .from("order_items")
    .delete()
    .eq("order_id", id);

  const { error } = await client
    .from("orders")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Gagal hapus order: " + error.message);
    return;
  }

  alert("Order berhasil dihapus");

  loadOrder();
}

window.onload = loadOrder;