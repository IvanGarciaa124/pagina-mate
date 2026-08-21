// ===================================================
// ANDO MATEANDO — MOTOR DE TIENDA E-COMMERCE
// ===================================================

let carrito = [];
let totalPesos = 0;
let cantidadTotalItems = 0;
let preciosDesdeExcel = {}; // Memoria de precios sincronizados con Google Sheets

const WHATSAPP_NUMERO = "5491162838484";
const LINK_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT4hUnxOnSWRy5zB8-N8CoUbiajbB2eqvFXXMLrgxx-xmM2Zr6YHqCKS2xo_malGOTWigtES3DNvIw2/pub?output=csv";

// === 1. GESTIÓN DEL CARRITO ===
function agregarAlCarrito(nombreProducto, precioOriginal, idStock) {
    let precioReal = preciosDesdeExcel[idStock] ? preciosDesdeExcel[idStock] : precioOriginal;

    let productoExistente = carrito.find(item => item.nombre === nombreProducto);

    if (productoExistente) {
        productoExistente.cantidad++;
    } else {
        carrito.push({
            nombre: nombreProducto,
            precioUnitario: precioReal,
            cantidad: 1,
            idStock: idStock
        });
    }

    recalcularCarrito();
    actualizarVisualCarrito();
    abrirCarrito();
    mostrarToast(`🧉 ${nombreProducto} agregado`);
    animarBadgeCarrito();
}

function modificarCantidad(indice, delta) {
    if (carrito[indice]) {
        carrito[indice].cantidad += delta;
        if (carrito[indice].cantidad <= 0) {
            carrito.splice(indice, 1);
        }
        recalcularCarrito();
        actualizarVisualCarrito();
        animarBadgeCarrito();
    }
}

function eliminarDelCarrito(indice) {
    if (carrito[indice]) {
        carrito.splice(indice, 1);
        recalcularCarrito();
        actualizarVisualCarrito();
        animarBadgeCarrito();
    }
}

function recalcularCarrito() {
    totalPesos = 0;
    cantidadTotalItems = 0;

    carrito.forEach(item => {
        if (item.idStock && preciosDesdeExcel[item.idStock]) {
            item.precioUnitario = preciosDesdeExcel[item.idStock];
        }
        totalPesos += item.precioUnitario * item.cantidad;
        cantidadTotalItems += item.cantidad;
    });

    try {
        localStorage.setItem('ando_mateando_cart', JSON.stringify(carrito));
    } catch(e) {}
}

function cargarCarritoGuardado() {
    try {
        let guardado = localStorage.getItem('ando_mateando_cart');
        if (guardado) {
            carrito = JSON.parse(guardado);
            recalcularCarrito();
            actualizarVisualCarrito();
        }
    } catch(e) {}
}

function actualizarVisualCarrito() {
    // Contadores en Navbar y Drawer
    document.querySelectorAll('.cart-badge, #contador-carrito').forEach(el => {
        el.innerText = cantidadTotalItems;
    });

    // Totales
    document.querySelectorAll('#precio-total, .cart-total-amount').forEach(el => {
        el.innerText = '$' + totalPesos.toLocaleString('es-AR');
    });

    // Lista en el Drawer
    let contenedorLista = document.getElementById('lista-carrito');
    if (!contenedorLista) return;

    if (carrito.length === 0) {
        contenedorLista.innerHTML = `
            <div class="cart-empty-state">
                <span>🧉</span>
                <p>Tu carrito está vacío.</p>
                <p style="font-size: 0.8rem; margin-top: 6px;">¡Explorá nuestro catálogo para sumar tus favoritos!</p>
            </div>
        `;
    } else {
        let html = '';
        carrito.forEach((item, index) => {
            let subtotal = item.precioUnitario * item.cantidad;
            html += `
                <div class="cart-item-row">
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.nombre}</div>
                        <div class="cart-item-unit-price">$${item.precioUnitario.toLocaleString('es-AR')} c/u</div>
                    </div>
                    <div class="cart-qty-control">
                        <button class="btn-qty" onclick="modificarCantidad(${index}, -1)" title="Restar">-</button>
                        <span class="cart-qty-number">${item.cantidad}</span>
                        <button class="btn-qty" onclick="modificarCantidad(${index}, 1)" title="Sumar">+</button>
                    </div>
                    <div class="cart-item-subtotal">$${subtotal.toLocaleString('es-AR')}</div>
                    <button class="btn-remove-item" onclick="eliminarDelCarrito(${index})" title="Eliminar">✕</button>
                </div>
            `;
        });
        contenedorLista.innerHTML = html;
    }
}

function animarBadgeCarrito() {
    document.querySelectorAll('.cart-badge').forEach(badge => {
        badge.classList.remove('bounce');
        void badge.offsetWidth; // Forzar reflow para reiniciar animación
        badge.classList.add('bounce');
    });
}

// === 2. DRAWER CARRITO (SLIDE-OVER) ===
function abrirCarrito() {
    let overlay = document.getElementById('cart-drawer-overlay');
    if (overlay) overlay.classList.add('open');
}

function cerrarCarrito() {
    let overlay = document.getElementById('cart-drawer-overlay');
    if (overlay) overlay.classList.remove('open');
}

function toggleCarrito() {
    let overlay = document.getElementById('cart-drawer-overlay');
    if (overlay) {
        if (overlay.classList.contains('open')) {
            cerrarCarrito();
        } else {
            abrirCarrito();
        }
    }
}

// === 3. VARIANTES DE PRODUCTO (COLORES / IMÁGENES) ===
function cambiarVariante(productId, imgSrc, productName, stockId, btnElement) {
    let img = document.getElementById('img-' + productId);
    if (img) img.src = imgSrc;

    let card = document.getElementById('card-' + productId) || (btnElement ? btnElement.closest('.product-card') : null);
    if (card) {
        card.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        if (btnElement) btnElement.classList.add('active');

        let allPrices = card.querySelectorAll('.price, .product-price');
        allPrices.forEach(p => p.style.display = 'none');

        let priceId = stockId.replace('stock', 'precio');
        let activePrice = document.getElementById(priceId);
        if (activePrice) activePrice.style.display = '';
    }

    let btn = document.getElementById('btn-' + productId);
    if (btn) {
        let precio = preciosDesdeExcel[stockId] ? preciosDesdeExcel[stockId] : 0;
        btn.setAttribute('onclick', `agregarAlCarrito('${productName}', ${precio}, '${stockId}')`);
    }
}

// === 4. FORMULARIO & CHECKOUT POR WHATSAPP ===
function abrirFormularioPedido() {
    if (carrito.length === 0) {
        mostrarToast("⚠️ Tu carrito está vacío.");
        return;
    }
    cerrarCarrito();
    let modalForm = document.getElementById('modal-formulario-checkout');
    if (modalForm) modalForm.classList.add('open');
}

function cerrarFormulario() {
    let modalForm = document.getElementById('modal-formulario-checkout');
    if (modalForm) modalForm.classList.remove('open');
    abrirCarrito();
}

function enviarPedido() {
    let nombre = document.getElementById('cliente-nombre').value.trim();
    let ig = document.getElementById('cliente-ig').value.trim();
    let metodoEntrega = document.getElementById('cliente-entrega') ? document.getElementById('cliente-entrega').value : "Envío a acordar";
    let notas = document.getElementById('cliente-notas') ? document.getElementById('cliente-notas').value.trim() : "";

    if (nombre === "" || ig === "") {
        alert("Por favor, completá tu Nombre e Instagram para que podamos comunicarnos con vos.");
        return;
    }

    let textoMensaje = `¡Hola *Ando Mateando*! 🧉 Quiero confirmar el siguiente pedido:\n\n`;
    textoMensaje += `*DETALLE DE COMPRA:*\n`;

    carrito.forEach(item => {
        let subtotal = item.precioUnitario * item.cantidad;
        textoMensaje += `▪️ ${item.cantidad}x ${item.nombre} ($${subtotal.toLocaleString('es-AR')})\n`;
    });

    textoMensaje += `\n*TOTAL ESTIMADO: $${totalPesos.toLocaleString('es-AR')}*\n\n`;
    textoMensaje += `*MIS DATOS:*\n`;
    textoMensaje += `👤 Nombre: ${nombre}\n`;
    textoMensaje += `📸 Instagram: ${ig}\n`;
    textoMensaje += `📦 Entrega: ${metodoEntrega}\n`;
    if (notas) {
        textoMensaje += `📝 Nota: ${notas}\n`;
    }

    let mensajeCodificado = encodeURIComponent(textoMensaje);
    let urlWhatsApp = `https://wa.me/${WHATSAPP_NUMERO}?text=${mensajeCodificado}`;
    
    window.open(urlWhatsApp, '_blank');

    let modalForm = document.getElementById('modal-formulario-checkout');
    if (modalForm) modalForm.classList.remove('open');
}

// === 5. FILTROS Y BÚSQUEDA EN CATÁLOGO ===
let categoriaActiva = 'todas';

function filtrarPorCategoria(catSlug, btnElement) {
    categoriaActiva = catSlug;

    document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
    if (btnElement) {
        btnElement.classList.add('active');
    }

    aplicarFiltrosCombinados();
}

function filtrarProductos() {
    let input = document.getElementById('buscador-productos');
    let btnClear = document.getElementById('btn-clear-search');
    if (btnClear && input) {
        btnClear.style.display = input.value.trim() !== '' ? 'block' : 'none';
    }
    aplicarFiltrosCombinados();
}

function limpiarBusqueda() {
    let input = document.getElementById('buscador-productos');
    let btnClear = document.getElementById('btn-clear-search');
    if (input) {
        input.value = '';
        if (btnClear) btnClear.style.display = 'none';
        aplicarFiltrosCombinados();
        input.focus();
    }
}

function aplicarFiltrosCombinados() {
    let inputBusqueda = document.getElementById('buscador-productos');
    let textoBusqueda = inputBusqueda ? inputBusqueda.value.toLowerCase().trim() : '';

    let categorias = ['cat-yerbas', 'cat-mates', 'cat-termos', 'cat-bombillas', 'cat-yerbera', 'cat-canastas'];
    let granTotalVisibles = 0;

    categorias.forEach(catId => {
        let catHeader = document.getElementById(catId);
        let grid = catHeader ? catHeader.nextElementSibling : null;

        let coincideCategoria = (categoriaActiva === 'todas') || (catId === 'cat-' + categoriaActiva);

        if (!grid || !grid.classList.contains('product-grid')) return;

        let cards = grid.querySelectorAll('.product-card');
        let cardsVisibles = 0;

        cards.forEach(card => {
            let titulo = card.querySelector('h4') ? card.querySelector('h4').innerText.toLowerCase() : '';
            let coincideTexto = textoBusqueda === '' || titulo.includes(textoBusqueda);

            if (coincideCategoria && coincideTexto) {
                card.classList.remove('producto-oculto');
                cardsVisibles++;
                granTotalVisibles++;
            } else {
                card.classList.add('producto-oculto');
            }
        });

        if (cardsVisibles === 0 || !coincideCategoria) {
            catHeader.classList.add('categoria-oculta');
            grid.classList.add('categoria-oculta');
        } else {
            catHeader.classList.remove('categoria-oculta');
            grid.classList.remove('categoria-oculta');
        }
    });

    // Mensaje de sin resultados si no hay ninguna coincidencia
    let sinResultadosBox = document.getElementById('sin-resultados');
    if (sinResultadosBox) {
        if (granTotalVisibles === 0) {
            sinResultadosBox.classList.add('show');
        } else {
            sinResultadosBox.classList.remove('show');
        }
    }
}

// === 6. INTEGRACIÓN CON GOOGLE SHEETS / EXCEL (PRECIOS EN VIVO) ===
async function cargarStockDesdeExcel() {
    try {
        let respuesta = await fetch(LINK_CSV);
        let datosCsv = await respuesta.text();
        let filas = datosCsv.split('\n');

        if (filas.length < 2) return;

        let headers = filas[0].split(',').map(h => h.trim().toLowerCase());
        let colId = 0;
        let colPrecio = -1;

        for (let h = 0; h < headers.length; h++) {
            if (headers[h].includes('precio')) {
                colPrecio = h;
                break;
            }
        }
        if (colPrecio === -1) colPrecio = 2;

        for (let i = 1; i < filas.length; i++) {
            let fila = filas[i].trim();
            if (!fila) continue;

            let columnas = fila.split(',');
            if (columnas.length < colPrecio + 1) continue;

            let idProducto = columnas[colId].trim();
            if (!idProducto.startsWith('stock-')) continue;

            let precioRaw = columnas[colPrecio].trim().replace(/[$\s]/g, '').replace(/\./g, '');
            let precioNumero = parseInt(precioRaw) || 0;

            preciosDesdeExcel[idProducto] = precioNumero;

            let idPrecio = idProducto.replace('stock', 'precio');
            let elementoPrecio = document.getElementById(idPrecio);

            if (elementoPrecio) {
                if (precioNumero > 0) {
                    elementoPrecio.innerText = '$' + precioNumero.toLocaleString('es-AR');
                } else {
                    elementoPrecio.innerText = 'Consultar';
                }
            }

            document.querySelectorAll(`button.btn-add, button.btn-add-product`).forEach(btn => {
                let onclick = btn.getAttribute('onclick');
                if (onclick && onclick.includes("'" + idProducto + "'")) {
                    btn.setAttribute('onclick', onclick.replace(/, \d+,/, ', ' + precioNumero + ','));
                }
            });
        }

        recalcularCarrito();
        actualizarVisualCarrito();
    } catch (error) {
        console.error("Error al sincronizar con Google Sheets:", error);
    }
}

// === 7. ENRUTADOR SPA (MULTI-PÁGINA FLUIDO) ===
function navigate() {
    let hash = window.location.hash || '#inicio';
    let view = 'inicio';

    if (hash === '#catalogo' || hash === '#tienda' || hash === '#productos' || hash.startsWith('#cat-')) {
        view = 'catalogo';
    } else if (hash === '#curado' || hash === '#guia') {
        view = 'curado';
    } else if (hash === '#faq' || hash === '#preguntas') {
        view = 'faq';
    } else if (hash === '#contacto' || hash === '#nosotros') {
        view = 'contacto';
    } else {
        view = 'inicio';
    }

    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active-view'));
    let targetView = document.getElementById('view-' + view);
    if (targetView) targetView.classList.add('active-view');

    document.querySelectorAll('.nav-links a, .footer-links-list a').forEach(link => {
        link.classList.remove('active');
        let href = link.getAttribute('href');
        if (href) {
            if (view === 'inicio' && href === '#inicio') link.classList.add('active');
            else if (view === 'catalogo' && (href === '#catalogo' || href === '#productos')) link.classList.add('active');
            else if (view === 'curado' && (href === '#curado' || href === '#guia')) link.classList.add('active');
            else if (view === 'faq' && href === '#faq') link.classList.add('active');
            else if (view === 'contacto' && href === '#contacto') link.classList.add('active');
        }
    });

    let navLinks = document.getElementById('nav-links-menu');
    if (navLinks) navLinks.classList.remove('mobile-open');

    if (hash.startsWith('#cat-')) {
        let catNombre = hash.replace('#cat-', '');
        let pill = document.querySelector(`.cat-pill[data-cat="${catNombre}"]`);
        if (pill) {
            filtrarPorCategoria(catNombre, pill);
        }
        let catElement = document.getElementById(hash.substring(1));
        if (catElement) {
            setTimeout(() => {
                catElement.scrollIntoView({ behavior: 'smooth' });
            }, 150);
        }
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// === 8. TABS DE LA GUÍA DE CURADO ===
function cambiarTabCurado(tabId, btnElement) {
    document.querySelectorAll('.curado-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.curado-tab-content').forEach(content => content.classList.remove('active'));

    if (btnElement) btnElement.classList.add('active');
    let targetContent = document.getElementById('curado-tab-' + tabId);
    if (targetContent) targetContent.classList.add('active');
}

// === 9. ACORDEONES FAQ ===
function toggleFaq(btnElement) {
    let faqCard = btnElement.closest('.faq-card');
    if (!faqCard) return;

    let isOpen = faqCard.classList.contains('faq-open');
    let answerPane = faqCard.querySelector('.faq-answer-pane');

    document.querySelectorAll('.faq-card').forEach(card => {
        if (card !== faqCard) {
            card.classList.remove('faq-open');
            let pane = card.querySelector('.faq-answer-pane');
            if (pane) pane.style.maxHeight = null;
        }
    });

    if (isOpen) {
        faqCard.classList.remove('faq-open');
        if (answerPane) answerPane.style.maxHeight = null;
    } else {
        faqCard.classList.add('faq-open');
        if (answerPane) answerPane.style.maxHeight = answerPane.scrollHeight + 'px';
    }
}

// === 10. LIGHTBOX GALERÍA DE IMÁGENES ===
let lightboxImages = [];
let lightboxCurrentIndex = 0;

function abrirLightbox(imgElement) {
    let modal = document.getElementById('lightbox-modal');
    let imgLightbox = document.getElementById('lightbox-img');
    let btnPrev = document.getElementById('lightbox-prev');
    let btnNext = document.getElementById('lightbox-next');

    if (modal && imgLightbox) {
        if (imgElement.hasAttribute('data-images')) {
            try {
                lightboxImages = JSON.parse(imgElement.getAttribute('data-images'));
            } catch(e) {
                lightboxImages = [imgElement.src];
            }
        } else {
            lightboxImages = [imgElement.src];
        }

        lightboxCurrentIndex = 0;
        imgLightbox.src = lightboxImages[lightboxCurrentIndex];

        if (btnPrev && btnNext) {
            let tieneVarias = lightboxImages.length > 1;
            btnPrev.style.display = tieneVarias ? 'flex' : 'none';
            btnNext.style.display = tieneVarias ? 'flex' : 'none';
        }

        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function cambiarImagenLightbox(delta, event) {
    if (event) event.stopPropagation();
    if (lightboxImages.length <= 1) return;

    lightboxCurrentIndex += delta;
    if (lightboxCurrentIndex >= lightboxImages.length) {
        lightboxCurrentIndex = 0;
    } else if (lightboxCurrentIndex < 0) {
        lightboxCurrentIndex = lightboxImages.length - 1;
    }

    let imgLightbox = document.getElementById('lightbox-img');
    if (imgLightbox) imgLightbox.src = lightboxImages[lightboxCurrentIndex];
}

function cerrarLightbox() {
    let modal = document.getElementById('lightbox-modal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// === 11. MENÚ MOBILE ===
function toggleMenuMobile() {
    let menu = document.getElementById('nav-links-menu');
    if (menu) menu.classList.toggle('mobile-open');
}

// === 12. TOAST NOTIFICATIONS ===
let toastTimeout;
function mostrarToast(mensaje) {
    let toast = document.getElementById('toast-notification');
    if (!toast) return;

    toast.innerHTML = mensaje;
    toast.classList.add('show');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// === 13. DETECCIÓN AUTOMÁTICA DE GALERÍAS EN PRODUCTOS ===
function inicializarBadgesGaleria() {
    document.querySelectorAll('.product-card').forEach(card => {
        let img = card.querySelector('img[data-images]');
        if (img) {
            try {
                let imagenes = JSON.parse(img.getAttribute('data-images'));
                if (imagenes.length > 1) {
                    let badgesContainer = card.querySelector('.product-badges');
                    if (!badgesContainer) {
                        badgesContainer = document.createElement('div');
                        badgesContainer.className = 'product-badges';
                        let imgWrapper = card.querySelector('.product-img-wrapper');
                        if (imgWrapper) imgWrapper.appendChild(badgesContainer);
                    }
                    let badgeGaleria = document.createElement('span');
                    badgeGaleria.className = 'badge-tag badge-galeria';
                    badgeGaleria.innerText = `📷 ${imagenes.length} fotos`;
                    badgesContainer.appendChild(badgeGaleria);
                }
            } catch(e) {}
        }
    });
}

// === 14. INICIALIZACIÓN ===
document.addEventListener("DOMContentLoaded", function() {
    cargarCarritoGuardado();
    cargarStockDesdeExcel();
    inicializarBadgesGaleria();

    window.addEventListener('hashchange', navigate);
    navigate();

    const navbar = document.getElementById('navbar-main');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 40) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    document.addEventListener('keydown', function(e) {
        let modal = document.getElementById('lightbox-modal');
        if (modal && modal.classList.contains('open')) {
            if (e.key === "Escape") cerrarLightbox();
            else if (e.key === "ArrowLeft") cambiarImagenLightbox(-1);
            else if (e.key === "ArrowRight") cambiarImagenLightbox(1);
        }
    });
});