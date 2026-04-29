async function loadOrder() {
  const { data } = await supabase.from("orders").select("*");

  let html = "";
  data.forEach(o => {
    html += `<p>Order ${o.id} - Rp${o.total}</p>`;
  });

  document.getElementById("order").innerHTML = html;
}