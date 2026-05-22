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
          gambar
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
    item.order_items.forEach((x, index) => {
      const harga = Number(x.price || 0);
      const qty = Number(x.qty || 0);
      const totalProduk = harga * qty;

      produkRows += `
        <tr>
          <td>${index + 1}</td>
          <td>${x.products?.nama_produk || "-"}</td>
          <td>${qty}</td>
          <td>${formatRupiah(harga)}</td>
          <td>${formatRupiah(totalProduk)}</td>
        </tr>
      `;
    });
  } else {
    produkRows = `
      <tr>
        <td colspan="5" style="text-align:center;">Tidak ada produk</td>
      </tr>
    `;
  }

  const invoiceHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${getOrderCode(item)}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 30px;
          color: #222;
        }

        h2, h3 {
          margin-bottom: 5px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #222;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }

        .company {
          font-size: 22px;
          font-weight: bold;
        }

        .muted {
          color: #666;
          font-size: 13px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          margin-bottom: 20px;
        }

        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          font-size: 14px;
        }

        th {
          background: #f1f5f9;
        }

        .total-box {
          width: 45%;
          margin-left: auto;
        }

        .total {
          font-size: 20px;
          font-weight: bold;
          color: #16a34a;
        }

        .text-right {
          text-align: right;
        }

        @media print {
          button {
            display: none;
          }
        }
      </style>
    </head>

    <body>
      <button onclick="window.print()" style="padding:10px 16px; margin-bottom:20px;">
        Simpan / Download PDF
      </button>

      <div class="header">
        <div>
          <div class="company">CV Pilar Kayana Nusa</div>
          <div class="muted">Invoice Pesanan Customer</div>
        </div>

        <div>
          <h2>INVOICE</h2>
          <div><b>${getOrderCode(item)}</b></div>
        </div>
      </div>

      <h3>Data Order</h3>
      <table>
        <tr>
          <th>Kode Order</th>
          <td>${getOrderCode(item)}</td>
        </tr>
        <tr>
          <th>Tanggal</th>
          <td>${
            item.created_at
              ? new Date(item.created_at).toLocaleString("id-ID")
              : "-"
          }</td>
        </tr>
        <tr>
          <th>Status</th>
          <td>${item.status || "-"}</td>
        </tr>
        <tr>
          <th>Sales</th>
          <td>${getSalesName(item)} (${getSalesCode(item)})</td>
        </tr>
      </table>

      <h3>Data Customer</h3>
      <table>
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
          <th>Pembayaran</th>
          <td>${item.payment_method || "-"}</td>
        </tr>
      </table>

      <h3>Rincian Produk</h3>
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Produk</th>
            <th>Qty</th>
            <th>Harga</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          ${produkRows}
        </tbody>
      </table>

      <div class="total-box">
        <table>
          <tr>
            <th>Subtotal</th>
            <td class="text-right">${formatRupiah(subtotal)}</td>
          </tr>
          <tr>
            <th>Diskon</th>
            <td class="text-right">${diskonPersen || 0}%</td>
          </tr>
          <tr>
            <th>Hemat</th>
            <td class="text-right">-${formatRupiah(hemat)}</td>
          </tr>
          <tr>
            <th>Total Bayar</th>
            <td class="text-right total">${formatRupiah(total)}</td>
          </tr>
        </table>
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