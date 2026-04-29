async function tambahProduk() {
  const nama = document.getElementById("nama").value;
  const harga = document.getElementById("harga").value;

  const { error } = await supabase
    .from("produk")
    .insert([{ nama, harga }]);

  if (error) return alert(error.message);

  alert("Berhasil!");
}

async function loadProduk() {
  const { data } = await supabase.from("produk").select("*");

  let html = "";

  data.forEach(p => {
    html += `
      <p>${p.nama} - Rp${p.harga}
      <button onclick="hapusProduk(${p.id})">Hapus</button>
      </p>
    `;
  });

  document.getElementById("list").innerHTML = html;
}

async function hapusProduk(id) {
  await supabase.from("produk").delete().eq("id", id);
  loadProduk();
}