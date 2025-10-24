// ===================== app.js =====================

// ===== Utilidad MXN (tuya) =====
function toMXN(num) {
  return Number(num || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}
function getPrecioFromDataset(el) {
  const raw = el?.dataset?.precio;
  return raw ? Number(raw) : 0;
}

// ===== Fondo FIJO NEUTRO y claro (sin efectos) =====
document.addEventListener("DOMContentLoaded", () => {
  document.body.style.backgroundColor = 'var(--fondo-1)';
});

// ===== PROMO simple =====
document.addEventListener("DOMContentLoaded", () => {
  const promos = [
    "Envío gratis en compras mayores a $499 MXN",
    "10% de descuento con el código TIKOS10",
    "Piezas únicas — stock limitado"
  ];
  const btnPromo = document.getElementById("btnPromo");
  const banner = document.getElementById("banner");
  if (btnPromo && banner) {
    btnPromo.addEventListener("click", () => {
      const randomPromo = promos[Math.floor(Math.random() * promos.length)];
      const p = banner.querySelector("p");
      if (p) p.textContent = randomPromo;
    });
  }
});

// ====== Tu lógica de pedido (intacta) ======
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formPedido');
  const outNombre = document.getElementById('outNombre');
  const outLista  = document.getElementById('outLista');
  const outTotal  = document.getElementById('outTotal');
  const btnConfirmar = document.getElementById('btnConfirmar');
  const confirmNombre = document.getElementById('confirmNombre');

  const toastBtn = document.getElementById('btnToast');
  const toastEl  = document.getElementById('toastAviso');
  if (toastBtn && toastEl && window.bootstrap) {
    const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
    toastBtn.addEventListener('click', () => toast.show());
  }

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombreCliente')?.value?.trim();
    const selModelo = document.getElementById('selModelo');
    const selTalla  = document.getElementById('selTalla');
    const selColor  = document.getElementById('selColor');
    const cantidad  = Number(document.getElementById('inpCantidad')?.value || 0);

    if (!nombre || !selModelo?.value || !selColor?.value || cantidad < 1) {
      alert('Completa nombre, modelo, color y cantidad (mínimo 1).');
      return;
    }

    const optModelo = selModelo.options[selModelo.selectedIndex];
    const precioModelo = getPrecioFromDataset(optModelo);
    let total = precioModelo * cantidad;

    const chkNombreNumero = document.getElementById('chkNombreNumero');
    const chkParcheLiga   = document.getElementById('chkParcheLiga');
    const extrasSeleccionados = [];
    if (chkNombreNumero?.checked) { total += getPrecioFromDataset(chkNombreNumero) * cantidad; extrasSeleccionados.push('Nombre y número'); }
    if (chkParcheLiga?.checked)   { total += getPrecioFromDataset(chkParcheLiga)   * cantidad; extrasSeleccionados.push('Parche de liga'); }

    const inpNombre = document.getElementById('inpNombre')?.value?.trim();
    const inpNumero = document.getElementById('inpNumero')?.value?.trim();

    const selEnvio = document.getElementById('selEnvio');
    const optEnvio = selEnvio ? selEnvio.options[selEnvio.selectedIndex] : null;
    const costoEnvio = optEnvio ? getPrecioFromDataset(optEnvio) : 0;
    total += costoEnvio;

    const txtInstr = document.getElementById('txtInstrucciones')?.value?.trim();

    if (outNombre) outNombre.textContent = nombre;
    if (outLista) {
      outLista.innerHTML = `
        <li><strong>Modelo:</strong> ${selModelo.value} — ${toMXN(precioModelo)} c/u × ${cantidad}</li>
        ${selTalla?.value ? `<li><strong>Talla:</strong> ${selTalla.value}</li>` : ''}
        <li><strong>Color:</strong> ${selColor.value}</li>
        <li><strong>Extras:</strong> ${extrasSeleccionados.length ? extrasSeleccionados.join(', ') : 'Ninguno'}</li>
        ${inpNombre || inpNumero ? `<li><strong>Personalización:</strong> ${inpNombre ? 'Nombre: ' + inpNombre : ''} ${inpNumero ? ' | Número: ' + inpNumero : ''}</li>` : ''}
        ${selEnvio ? `<li><strong>Envío:</strong> ${selEnvio.value} — ${toMXN(costoEnvio)}</li>` : ''}
        ${txtInstr ? `<li><strong>Instrucciones:</strong> ${txtInstr}</li>` : ''}
      `;
    }
    if (outTotal) outTotal.textContent = toMXN(total);
    if (btnConfirmar) btnConfirmar.disabled = false;
    if (confirmNombre) confirmNombre.textContent = nombre;
  });

  form.addEventListener('reset', () => {
    setTimeout(() => {
      if (outNombre) outNombre.textContent = '—';
      if (outLista) outLista.innerHTML = '<li class="text-muted">Aún no has generado tu pedido.</li>';
      if (outTotal) outTotal.textContent = '$0';
      if (btnConfirmar) btnConfirmar.disabled = true;
    }, 0);
  });
});

// ================== CARRITO (intacto) ==================
(function () {
  const badge = document.getElementById('cartBadge');
  const list  = document.getElementById('cartList');
  const total = document.getElementById('cartTotal');
  const btnClear = document.getElementById('btnClearCart');
  const btnCheckout = document.getElementById('btnCheckout');

  let cart = [];

  const formatMXN = (n) => Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  const save = () => localStorage.setItem('tikos_cart', JSON.stringify(cart));
  const load = () => { try { cart = JSON.parse(localStorage.getItem('tikos_cart')) || []; } catch { cart = []; } };

  function syncBadge() {
    const qty = cart.reduce((acc, it) => acc + it.qty, 0);
    if (badge) {
      badge.textContent = qty;
      badge.classList.toggle('d-none', qty === 0);
    }
  }

  function render() {
    if (!list || !total) return;
    list.innerHTML = '';
    if (cart.length === 0) {
      list.innerHTML = `<li class="list-group-item text-center text-muted">Tu carrito está vacío.</li>`;
      total.textContent = formatMXN(0);
      syncBadge();
      return;
    }

    let sum = 0;
    cart.forEach((it, idx) => {
      const line = it.price * it.qty;
      sum += line;
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex align-items-center justify-content-between gap-2';
      li.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <img src="${it.img}" alt="${it.name}" width="48" height="48" class="rounded">
          <div>
            <div class="fw-semibold">${it.name}</div>
            <div class="text-muted"> ${formatMXN(it.price)} c/u </div>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-outline-secondary qty-btn" data-act="dec" data-idx="${idx}">−</button>
          <span class="px-1">${it.qty}</span>
          <button class="btn btn-sm btn-outline-secondary qty-btn" data-act="inc" data-idx="${idx}">+</button>
          <span class="ms-2 fw-semibold">${formatMXN(line)}</span>
          <button class="btn btn-sm btn-outline-danger ms-2" data-act="del" data-idx="${idx}" title="Quitar">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      `;
      list.appendChild(li);
    });

    total.textContent = formatMXN(sum);
    syncBadge();
  }

  function addItem({ name, price, img }) {
    const i = cart.findIndex(it => it.name === name);
    if (i >= 0) cart[i].qty += 1;
    else cart.push({ name, price: Number(price), img, qty: 1 });
    save(); render();
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart');
    if (btn) {
      const name = btn.dataset.name || btn.getAttribute('data-name');
      const price = btn.dataset.price || btn.getAttribute('data-price');
      const img = btn.dataset.img || btn.getAttribute('data-img') || '';
      if (!name || !price) return;
      addItem({ name, price, img });

      btn.disabled = true;
      const prev = btn.innerHTML;
      btn.innerHTML = `<i class="bi bi-check2-circle"></i> Añadido`;
      setTimeout(() => { btn.disabled = false; btn.innerHTML = prev; }, 900);
    }
  });

  if (list) {
    list.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const act = btn.dataset.act;
      const idx = Number(btn.dataset.idx);
      if (Number.isNaN(idx) || !cart[idx]) return;

      if (act === 'inc') cart[idx].qty += 1;
      if (act === 'dec') cart[idx].qty = Math.max(1, cart[idx].qty - 1);
      if (act === 'del') cart.splice(idx, 1);
      save(); render();
    });
  }

  btnClear?.addEventListener('click', () => {
    if (cart.length === 0) return;
    if (confirm('¿Vaciar carrito?')) { cart = []; save(); render(); }
  });

  btnCheckout?.addEventListener('click', () => {
    if (cart.length === 0) return;
    const resumen = cart.map(it => `${it.qty}× ${it.name} (${formatMXN(it.price * it.qty)})`).join('\n');
    alert('Tu pedido:\n' + resumen + '\n\nGracias por comprar en TikosBazar ❤️');
  });

  load(); render();
})();
