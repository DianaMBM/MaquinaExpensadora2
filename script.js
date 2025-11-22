// Lógica principal de carrito y modales
document.addEventListener("DOMContentLoaded", () => {

  let carrito = []; 
  let total = 0;
  let productosAPI = [];
  let categoriasAPI = [];
  let categoriaActiva = "todos";
  let mapaCategoriasId = {};

  // Use local PHP proxy to avoid Mixed Content / CORS issues
  // Use relative paths so the app works from a subfolder (e.g. /MaquinaExpendedora/)
  const API_PROXY = "api.php?endpoint="; // relative -> resolves under current document path
  const PROXY_PHP = "proxy.php?url="; // relative proxy for images/resources
  const API_REMOTE_BASE = "http://138.68.24.136:3000"; // used only to build proxied resource URLs
  const txtContador = document.getElementById("contadorCarrito");
  const txtTotal = document.getElementById("totalCarrito");
  const popup = document.getElementById("popupAgregado");

  // Error banner element (created on demand)
  function showErrorBanner(message) {
    let banner = document.getElementById('errorBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'errorBanner';
      banner.style.position = 'fixed';
      banner.style.top = '10px';
      banner.style.left = '50%';
      banner.style.transform = 'translateX(-50%)';
      banner.style.zIndex = '9999';
      banner.style.padding = '12px 18px';
      banner.style.background = '#f8d7da';
      banner.style.color = '#842029';
      banner.style.border = '1px solid #f5c2c7';
      banner.style.borderRadius = '6px';
      banner.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
      banner.style.fontSize = '14px';
      banner.style.maxWidth = '90%';
      banner.style.textAlign = 'center';
      banner.style.wordWrap = 'break-word';
      document.body.appendChild(banner);
    }
    banner.textContent = message;
  }

  // Quick runtime checks and debug hints
  console.log('Script started — protocol:', location.protocol, 'API_PROXY=', API_PROXY);

  // If the page is opened via file:// the browser will block fetch to /api.php
  if (location.protocol === 'file:') {
    showErrorBanner('La página se está abriendo desde el sistema de archivos (file://). Debes servirla por HTTP/HTTPS para que las llamadas a `api.php` funcionen. Ejecuta en la carpeta del proyecto: `php -S 0.0.0.0:8000 -t .` y abre http://localhost:8000/Index.html, o sube los archivos al servidor.');
    console.warn('Detected file:// protocol — fetch to /api.php will fail. Serve the project over http/https.');
    return;
  }

  const modalDetalle = document.getElementById("modalDetalleProducto");
  const modalCarrito = document.getElementById("modalCarrito");
  const modalPago = document.getElementById("modalPago");
  const modalCarritoVacio = document.getElementById("modalCarritoVacio");

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
  const btnCerrarModalCarritoVacio = document.getElementById("cerrarModalCarritoVacio");

  async function cargarProductosAPI() {
    try {
      const response = await fetch(`${API_PROXY}productos`);
      if (!response.ok) {
        console.warn('API proxy returned non-ok status for productos:', response.status);
        // If server returned 502 Bad Gateway, try fallback to local static file
        if (response.status === 502) {
          showErrorBanner('El proxy no puede alcanzar la API remota. Intentando fallback con `productos.json` si existe.');
          try {
            const fallback = await fetch('productos.json');
            if (fallback.ok) {
              const data = await fallback.json();
              productosAPI = Array.isArray(data) ? data : (data.data || data.productos || []);
              await cargarCategoriasAPI();
              rellenarCards();
              return;
            }
          } catch (e) {
            console.error('Fallback productos.json failed:', e);
          }
        }
        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      productosAPI = Array.isArray(data) ? data : (data.data || data.productos || []);
      await cargarCategoriasAPI();
      rellenarCards();
    } catch (error) {
      console.error('Error cargando productos desde proxy:', error);
      showErrorBanner('Error cargando productos. Si el proxy no puede acceder al API remoto. Arregla la conectividad. (' + (error.message || error) + ')');
    }
  }

  async function cargarCategoriasAPI() {
    try {
      const response = await fetch(`${API_PROXY}categorias`);
      if (!response.ok) {
        console.warn('API proxy returned non-ok status for categorias:', response.status);
        if (response.status === 502) {
          showErrorBanner('El proxy no puede alcanzar la API remota. Intentando fallback con `categorias.json` si existe.');
          try {
            const fallback = await fetch('categorias.json');
            if (fallback.ok) {
              const data = await fallback.json();
              categoriasAPI = Array.isArray(data) ? data : (data.data || data.categorias || []);
              categoriasAPI.forEach(cat => {
                mapaCategoriasId[cat.id] = cat.nombre.toLowerCase().trim();
              });
              return;
            }
          } catch (e) {
            console.error('Fallback categorias.json failed:', e);
          }
        }
        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      categoriasAPI = Array.isArray(data) ? data : (data.data || data.categorias || []);
      categoriasAPI.forEach(cat => {
        mapaCategoriasId[cat.id] = cat.nombre.toLowerCase().trim();
      });
    } catch (error) {
      console.error('Error cargando categorias desde proxy:', error);
      showErrorBanner('Error cargando categorías. Si el proxy no puede acceder al API remoto. Arregla la conectividad. (' + (error.message || error) + ')');
    }
  }

  function rellenarCards() {
    const cardsGrid = document.querySelector(".cards-grid");
    let productosFiltrados = productosAPI;
    
    if (categoriaActiva !== "todos") {
      productosFiltrados = productosAPI.filter(producto => {
        const categoriaNombre = mapaCategoriasId[producto.categoriaId] || "";
        return categoriaNombre === categoriaActiva;
      });
    }

    cardsGrid.innerHTML = "";

    productosFiltrados.forEach((producto) => {
      const card = document.createElement("div");
      card.className = "card Card-Product-Preview";
      
      const imagen = document.createElement("img");
      imagen.className = "card-img-top";
      
      let imagenUrl = producto.imageUrl || producto.imagen;
      if (imagenUrl) {
        // If the image URL is already absolute (http/https), proxy it via proxy.php
        if (/^https?:\/\//i.test(imagenUrl)) {
          imagen.setAttribute("src", `${PROXY_PHP}${encodeURIComponent(imagenUrl)}`);
        } else {
          // Otherwise build absolute URL against the remote API host and proxy it
          const remotePath = imagenUrl.startsWith("/") ? (API_REMOTE_BASE + imagenUrl) : (API_REMOTE_BASE + "/" + imagenUrl);
          imagen.setAttribute("src", `${PROXY_PHP}${encodeURIComponent(remotePath)}`);
        }
      }
      imagen.setAttribute("alt", producto.nombre || "Producto");
      
      const cardBody = document.createElement("div");
      cardBody.className = "card-body text-center";
      
      const precio = document.createElement("h5");
      precio.className = "precio";
      precio.textContent = `Q ${producto.precio.toFixed(2)}`;
      
      const descripcion = document.createElement("p");
      descripcion.className = "nombre-producto";
      descripcion.textContent = producto.descripcionCorta || producto.nombre;
      
      const btn = document.createElement("button");
      btn.className = "btn btn-dark rounded-pill px-4 py-2";
      btn.textContent = "Añadir";
      
      cardBody.appendChild(precio);
      cardBody.appendChild(descripcion);
      cardBody.appendChild(btn);
      
      card.appendChild(imagen);
      card.appendChild(cardBody);
      
      cardsGrid.appendChild(card);
      
      card.dataset.productId = producto.id;
      card.dataset.productoOriginal = JSON.stringify(producto);
    });
    
    agregarEventListenersCards();
  }

  function agregarEventListenersCards() {
    document.querySelectorAll(".Card-Product-Preview").forEach(card => {
      card.replaceWith(card.cloneNode(true));
    });

    document.querySelectorAll(".Card-Product-Preview").forEach(card => {
      const btn = card.querySelector(".btn-dark");
      
      if (btn) {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();

          const nombre = card.querySelector(".nombre-producto").textContent;
          const imagen = card.querySelector("img").src;
          const precioText = card.querySelector(".precio").textContent.replace("Q ", "").trim();
          const precio = parseFloat(precioText);
          const productoCompleto = card.dataset.productoOriginal ? JSON.parse(card.dataset.productoOriginal) : null;

          agregarProducto(nombre, precio, imagen, productoCompleto);
        });
      }

      card.addEventListener("click", (e) => {
        if (e.target.closest(".btn-dark")) {
          return;
        }

        modalDetalle.querySelector("#modalNombre").textContent =
          card.querySelector(".nombre-producto").textContent;

        modalDetalle.querySelector("#modalPrecio").textContent =
          card.querySelector(".precio").textContent;

        modalDetalle.querySelector("#modalImagen").src =
          card.querySelector("img").src;

        const productoCompleto = card.dataset.productoOriginal ? JSON.parse(card.dataset.productoOriginal) : null;
        const descripcion = productoCompleto?.descripcionLarga || productoCompleto?.descripcionCorta || "Este es un delicioso producto de alta calidad, ideal para disfrutar en cualquier momento del día.";

        modalDetalle.querySelector("#modalDescripcion").textContent = descripcion;

        modalDetalle.classList.add("mostrar");
      });
    });
  }

  function cerrarTodosLosModales() {
    modalDetalle.classList.remove("mostrar");
    modalCarrito.classList.remove("mostrar");
    modalPago.classList.remove("mostrar");
    modalCarritoVacio.classList.remove("mostrar");
  }

  function validarCarritoNoVacio() {
    if (carrito.length === 0) {
      cerrarTodosLosModales();
      modalCarritoVacio.classList.add("mostrar");
      return false;
    }
    return true;
  }

  cargarProductosAPI();

  function mostrarPopup() {
    popup.classList.add("popup-show");
    setTimeout(() => popup.classList.remove("popup-show"), 1800);
  }

  function actualizarTotales() {
    txtContador.textContent = carrito.length;
    txtTotal.textContent = `Q${total.toFixed(2)}`;
  }

  function agregarProducto(nombre, precio, imagen, productoCompleto = null) {
    carrito.push({
      nombre,
      precio,
      imagen,
      ...productoCompleto
    });

    total += precio;
    actualizarTotales();
    mostrarPopup();
  }

  btnCerrarModal.addEventListener("click", () => {
    modalDetalle.classList.remove("mostrar");
  });

  btnAgregarModal.addEventListener("click", () => {
    const nombre = document.getElementById("modalNombre").textContent;
    const imagen = document.getElementById("modalImagen").src;
    const precioText = document.getElementById("modalPrecio").textContent.replace("Q ", "").trim();
    const precio = parseFloat(precioText);

    agregarProducto(nombre, precio, imagen);
    modalDetalle.classList.remove("mostrar");
  });

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
    if (!validarCarritoNoVacio()) return;
    cerrarTodosLosModales();
    renderizarPago();
    modalPago.classList.add("mostrar");
  });

  btnCerrarPago.addEventListener("click", () => {
    modalPago.classList.remove("mostrar");
  });

  btnCerrarModalCarritoVacio.addEventListener("click", () => {
    modalCarritoVacio.classList.remove("mostrar");
  });

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
    modalQR.classList.remove("mostrar");
  });

  document.querySelectorAll("#continuarPagoCarrito, #modalCarrito .btn-pago-qr").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!validarCarritoNoVacio()) return;
      cerrarTodosLosModales();
      renderizarPago();
      modalPago.classList.add("mostrar");
    });
  });

  document.querySelectorAll(".btn-categoria").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-categoria").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const textoBotón = btn.textContent.trim().toLowerCase();
      let categoriaEncontrada = null;
      
      if (textoBotón.includes("todos")) {
        categoriaActiva = "todos";
      } else {
        for (let id in mapaCategoriasId) {
          const nombreCategoria = mapaCategoriasId[id];
          const nombreLimpio = nombreCategoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const textoBtnLimpio = textoBotón.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          
          if (nombreLimpio.includes(textoBtnLimpio) || textoBtnLimpio.includes(nombreLimpio)) {
            categoriaActiva = nombreCategoria;
            categoriaEncontrada = true;
            break;
          }
        }
      }
      
      rellenarCards();
    });
  });
});





