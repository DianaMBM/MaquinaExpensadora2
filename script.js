// Lógica principal de carrito y modales
document.addEventListener("DOMContentLoaded", () => {

  let carrito = []; 
  let total = 0;

  const precioProducto = 10.0;
  const txtContador = document.getElementById("contadorCarrito");
  const txtTotal = document.getElementById("totalCarrito");
  const popup = document.getElementById("popupAgregado");

  const modalDetalle = document.getElementById("modalDetalleProducto");
  const modalCarrito = document.getElementById("modalCarrito");
  const modalPago = document.getElementById("modalPago");

  const listaCarrito = document.getElementById("listaCarrito");
  const listaPago = document.getElementById("listaPago");

  const totalCarritoModal = document.getElementById("totalCarritoModal");
  const totalPago = document.getElementById("totalPago");

  const btnCerrarModal = document.getElementById("cerrarModal");
  const btnAgregarModal = document.getElementById("agregarDesdeModal");
  const btnCarrito = document.querySelector(".btn-productos");
  const btnCerrarCarrito = document.getElementById("cerrarCarrito");
  const btnPagar = document.getElementById("btnPagar");
  const btnCerrarPago = document.getElementById("cerrarPago");

  // Función para cerrar todos los modales
  function cerrarTodosLosModales() {
    modalDetalle.classList.remove("mostrar");
    modalCarrito.classList.remove("mostrar");
    modalPago.classList.remove("mostrar");
  }

  // Mostrar popup cuando agrega un producto
  function mostrarPopup() {
    popup.classList.add("popup-show");
    setTimeout(() => popup.classList.remove("popup-show"), 1800);
  }

  // Actualiza contador de productos y total
  function actualizarTotales() {
    txtContador.textContent = carrito.length;
    txtTotal.textContent = `Q${total.toFixed(2)}`;
  }

  // Agregar producto como tarjeta nueva (NO agrupar cantidades)
  function agregarProducto(nombre, precio, imagen) {
    carrito.push({
      nombre,
      precio,
      imagen
    });

    total += precio;
    actualizarTotales();
    mostrarPopup();
  }

  // Añadir desde las tarjetas principales
  document.querySelectorAll(".Card-Product-Preview .btn-dark").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();

      const card = e.target.closest(".Card-Product-Preview");
      const nombre = card.querySelector(".nombre-producto").textContent;
      const imagen = card.querySelector("img").src;

      agregarProducto(nombre, precioProducto, imagen);
    });
  });

  // Abrir modal detalle producto
  document.querySelectorAll(".Card-Product-Preview").forEach(card => {
    card.addEventListener("click", () => {

      modalDetalle.querySelector("#modalNombre").textContent =
        card.querySelector(".nombre-producto").textContent;

      modalDetalle.querySelector("#modalPrecio").textContent =
        card.querySelector(".precio").textContent;

      modalDetalle.querySelector("#modalImagen").src =
        card.querySelector("img").src;

      modalDetalle.querySelector("#modalDescripcion").textContent =
        "Este es un delicioso producto de alta calidad, ideal para disfrutar en cualquier momento del día.";

      modalDetalle.classList.add("mostrar");
    });
  });

  btnCerrarModal.addEventListener("click", () => {
    modalDetalle.classList.remove("mostrar");
  });

  btnAgregarModal.addEventListener("click", () => {
    const nombre = document.getElementById("modalNombre").textContent;
    const imagen = document.getElementById("modalImagen").src;

    agregarProducto(nombre, precioProducto, imagen);
    modalDetalle.classList.remove("mostrar");
  });

  // Renderizar carrito
  function renderizarCarrito() {
    listaCarrito.innerHTML = "";

    if (carrito.length === 0) {
      listaCarrito.innerHTML =
        "<p class='text-center text-muted'>No hay productos en el carrito.</p>";
      totalCarritoModal.textContent = "Q0.00";
      return;
    }

    carrito.forEach((prod, index) => {
      const item = document.createElement("div");
      item.classList.add("item-carrito");

      item.innerHTML = `
        <div class="item-info">
          <img src="${prod.imagen}">
          <div class="item-textos">
            <h4 class="precio-rojo">Q${prod.precio.toFixed(2)}</h4>
            <p class="nombre-item">${prod.nombre}</p>
          </div>
        </div>

        <button class="btn-eliminar" data-index="${index}">
          <i class="bi bi-trash"></i> Eliminar
        </button>
      `;

      listaCarrito.appendChild(item);
    });

    totalCarritoModal.textContent = `Q${total.toFixed(2)}`;
  }

  btnCarrito.addEventListener("click", () => {
    cerrarTodosLosModales();
    renderizarCarrito();
    modalCarrito.classList.add("mostrar");
  });

  btnCerrarCarrito.addEventListener("click", () => {
    modalCarrito.classList.remove("mostrar");
  });

  listaCarrito.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-eliminar");
    if (!btn) return;

    const index = btn.dataset.index;
    total -= carrito[index].precio;
    carrito.splice(index, 1);

    actualizarTotales();
    renderizarCarrito();
  });

  // Modal Pago (misma estética que carrito)
  function renderizarPago() {
    listaPago.innerHTML = "";

    carrito.forEach(prod => {
      const item = document.createElement("div");
      item.classList.add("item-pago");

      item.innerHTML = `
        <div class="item-info">
          <img src="${prod.imagen}">
          <div class="item-textos">
            <h4 class="precio-rojo">Q${prod.precio.toFixed(2)}</h4>
            <p class="nombre-item">${prod.nombre}</p>
          </div>
        </div>
      `;

      listaPago.appendChild(item);
    });

    totalPago.textContent = `Q${total.toFixed(2)}`;
  }

  btnPagar.addEventListener("click", () => {
    cerrarTodosLosModales();
    renderizarPago();
    modalPago.classList.add("mostrar");
  });

  btnCerrarPago.addEventListener("click", () => {
    modalPago.classList.remove("mostrar");
  });

  // POS
  const modalPOS = document.getElementById("modalPOS");
  const btnPagarTarjetaList = document.querySelectorAll("#btnPagarTarjeta, #btnPagarCarritoTarjeta");
  const cerrarPOS = document.getElementById("cerrarPOS");

  btnPagarTarjetaList.forEach(btn => {
    btn.addEventListener("click", () => {
      cerrarTodosLosModales();
      modalPOS.classList.add("mostrar");
    });
  });

  cerrarPOS.addEventListener("click", () => {
    modalPOS.classList.remove("mostrar");
  });

  // QR
  const modalQR = document.getElementById("modalQR");
  const btnPagarQRList = document.querySelectorAll("#btnPagarQR, #btnPagarCarritoQR");
  const cerrarQR = document.getElementById("cerrarQR");

  btnPagarQRList.forEach(btn => {
    btn.addEventListener("click", () => {
      cerrarTodosLosModales();
      modalQR.classList.add("mostrar");
    });
  });

  cerrarQR.addEventListener("click", () => {
    cerrarQR();
  });
});


// POS
const modalPOS = document.getElementById("modalPOS");
const cerrarPOS = document.getElementById("cerrarPOS");

// QR
const modalQR = document.getElementById("modalQR");
const cerrarQR = document.getElementById("cerrarQR");

// Abrir POS desde carrito y pago
document.querySelectorAll("#continuarPagoCarrito, #btnPagarTarjeta").forEach(btn => {
  btn.addEventListener("click", () => {
    modalPOS.classList.add("mostrar");
  });
});

// Abrir QR desde carrito y pago
document.querySelectorAll(".btn-pago-qr, #btnPagarQR").forEach(btn => {
  btn.addEventListener("click", () => {
    modalQR.classList.add("mostrar");
  });
});

// Cerrar POS
cerrarPOS.addEventListener("click", () => {
  modalPOS.classList.remove("mostrar");
});

// Cerrar QR
cerrarQR.addEventListener("click", () => {
  modalQR.classList.remove("mostrar");
});

// Activar categoría seleccionada
document.querySelectorAll(".btn-categoria").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".btn-categoria").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});
