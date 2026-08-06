let carrito = [];
let totalPesos = 0;
let cantidadTotalItems = 0;
let preciosDesdeExcel = {}; // <-- MEMORIA PARA LOS PRECIOS

// 1. SUMAR AL CARRITO
function agregarAlCarrito(nombreProducto, precioOriginal, idStock) {
    let precioReal = preciosDesdeExcel[idStock] ? preciosDesdeExcel[idStock] : precioOriginal;

    let productoExistente = carrito.find(item => item.nombre === nombreProducto);

    if (productoExistente) {
        productoExistente.cantidad++;
    } else {
        carrito.push({ 
            nombre: nombreProducto, 
            precioUnitario: precioReal,
            cantidad: 1
        });
    }
    
    totalPesos += precioReal;
    cantidadTotalItems++; 
    actualizarVisualCarrito();
    
    let modal = document.getElementById('modal-carrito');
    modal.classList.add('carrito-visible');
}

// 1b. CAMBIAR VARIANTE DE COLOR
function cambiarVariante(productId, imgSrc, productName, stockId, btnElement) {
    // Cambiar imagen
    let img = document.getElementById('img-' + productId);
    if (img) {
        img.src = imgSrc;
    }
    
    // Cambiar botón activo
    let card = document.getElementById('card-' + productId);
    if (card) {
        card.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        btnElement.classList.add('active');
        
        // Ocultar todos los precios y stocks visibles, mostrar el activo
        let allPrices = card.querySelectorAll('.price');
        let allStocks = card.querySelectorAll('.stock-info');
        
        allPrices.forEach(p => p.style.display = 'none');
        allStocks.forEach(s => s.style.display = 'none');
        
        let priceId = stockId.replace('stock', 'precio');
        let activePrice = document.getElementById(priceId);
        let activeStock = activePrice ? activePrice.nextElementSibling : null;
        
        if (activePrice) activePrice.style.display = '';
        if (activeStock) activeStock.style.display = '';
    }
    
    // Actualizar el botón de agregar
    let btn = document.getElementById('btn-' + productId);
    if (btn) {
        let precio = preciosDesdeExcel[stockId] ? preciosDesdeExcel[stockId] : 0;
        btn.setAttribute('onclick', `agregarAlCarrito('${productName}', ${precio}, '${stockId}')`);
    }
}

// 2. ELIMINAR DEL CARRITO
function eliminarDelCarrito(indice) {
    let producto = carrito[indice];

    totalPesos -= producto.precioUnitario;
    cantidadTotalItems--;
    producto.cantidad--;

    if (producto.cantidad === 0) {
        carrito.splice(indice, 1);
    }

    actualizarVisualCarrito();
}

// 3. DIBUJAR LA LISTA
function actualizarVisualCarrito() {
    document.getElementById('contador-carrito').innerText = cantidadTotalItems;
    document.getElementById('precio-total').innerText = totalPesos.toLocaleString('es-AR');

    let contenedorLista = document.getElementById('lista-carrito');
    contenedorLista.innerHTML = ''; 

    if (carrito.length === 0) {
        contenedorLista.innerHTML = '<p style="color: #888; font-size: 0.9rem;">El carrito está vacío.</p>';
    } else {
        carrito.forEach((item, index) => {
            let subtotal = item.precioUnitario * item.cantidad;
            contenedorLista.innerHTML += `
                <div class="item-carrito">
                    <span>${item.nombre} <strong>(x${item.cantidad})</strong></span>
                    <div class="item-precio-cruz">
                        <strong>$${subtotal.toLocaleString('es-AR')}</strong>
                        <button class="btn-eliminar" onclick="eliminarDelCarrito(${index})">❌</button>
                    </div>
                </div>
            `;
        });
    }
}

// 4. ABRIR/CERRAR CON EL BOTÓN DEL MENÚ
function toggleCarrito() {
    let modal = document.getElementById('modal-carrito');
    modal.classList.toggle('carrito-visible');
}

// 5. CERRAR AL TOCAR AFUERA
document.addEventListener('click', function(evento) {
    let modalCarrito = document.getElementById('modal-carrito');
    let btnCarrito = document.getElementById('btn-carrito');
    let modalFormulario = document.getElementById('modal-formulario');

    if (modalCarrito && modalCarrito.classList.contains('carrito-visible')) {
        let toqueAdentro = modalCarrito.contains(evento.target);
        let toqueBotonMenu = btnCarrito && btnCarrito.contains(evento.target);
        let toqueBotonAgregar = evento.target.closest('.btn-add'); 
        let toqueBotonEliminar = evento.target.closest('.btn-eliminar');
        let toqueFormulario = modalFormulario && modalFormulario.contains(evento.target);

        if (!toqueAdentro && !toqueBotonMenu && !toqueBotonAgregar && !toqueBotonEliminar && !toqueFormulario) {
            modalCarrito.classList.remove('carrito-visible');
        }
    }
});

// 6. FUNCIONES DEL FORMULARIO Y PEDIDO
function abrirFormularioPedido() {
    if (carrito.length === 0) {
        alert("El carrito está vacío. ¡Agregá algún producto primero!");
        return;
    }
    document.getElementById('modal-carrito').classList.remove('carrito-visible');
    document.getElementById('modal-formulario').classList.add('mostrar-form');
}

function cerrarFormulario() {
    document.getElementById('modal-formulario').classList.remove('mostrar-form');
    document.getElementById('modal-carrito').classList.add('carrito-visible');
}

function enviarPedido() {
    let nombre = document.getElementById('cliente-nombre').value;
    let ig = document.getElementById('cliente-ig').value;

    if (nombre === "" || ig === "") {
        alert("Por favor, completá todos tus datos para poder armar el pedido.");
        return;
    }

    let textoMensaje = `¡Hola Ando Mateando! 🧉 Quería hacer un pedido:\n\n`;
    
    carrito.forEach(item => {
        let subtotal = item.precioUnitario * item.cantidad;
        textoMensaje += `- ${item.cantidad}x ${item.nombre} ($${subtotal.toLocaleString('es-AR')})\n`;
    });

    textoMensaje += `\n*Total del pedido: $${totalPesos.toLocaleString('es-AR')}*\n\n`;
    textoMensaje += `*Mis datos:*\n`;
    textoMensaje += `- Nombre: ${nombre}\n`;
    textoMensaje += `- Instagram: ${ig}\n`;

    let mensajeCodificado = encodeURIComponent(textoMensaje);
    let numeroVendedor = "5491162838484"; 
    let urlWhatsApp = `https://wa.me/${numeroVendedor}?text=${mensajeCodificado}`;
    window.location.href = urlWhatsApp;
    
    document.getElementById('modal-formulario').classList.remove('mostrar-form');
}

// 7. MENÚ HAMBURGUESA PARA CELULARES
function toggleMenu() {
    let menu = document.getElementById('menu-links');
    menu.classList.toggle('menu-activo');
}

// 7b. DROPDOWN CATÁLOGO
function cerrarDropdown() {
    document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'));
}

// Toggle dropdown al hacer click (funciona en mobile y desktop táctil)
document.addEventListener('click', function(e) {
    let toggleBtn = e.target.closest('.dropdown-toggle');
    if (toggleBtn) {
        e.preventDefault();
        let dropdown = toggleBtn.closest('.nav-dropdown');
        dropdown.classList.toggle('open');
    } else if (!e.target.closest('.dropdown-menu')) {
        cerrarDropdown();
    }
});

// 8. BUSCADOR DE PRODUCTOS
function filtrarProductos() {
    let input = document.getElementById('buscador-productos').value.toLowerCase();
    
    // Función auxiliar para filtrar una categoría
    function filtrarCategoria(idCategoria) {
        let catHeader = document.getElementById(idCategoria);
        if (!catHeader) return;
        
        let grid = catHeader.nextElementSibling;
        if (!grid || !grid.classList.contains('product-grid')) return;
        
        let cards = grid.querySelectorAll('.product-card');
        let visibles = 0;
        
        cards.forEach(card => {
            let nombre = card.querySelector('h4').innerText.toLowerCase();
            if (nombre.includes(input)) {
                card.classList.remove('producto-oculto');
                visibles++;
            } else {
                card.classList.add('producto-oculto');
            }
        });
        
        if (visibles === 0) {
            catHeader.classList.add('categoria-oculta');
            grid.classList.add('categoria-oculta');
        } else {
            catHeader.classList.remove('categoria-oculta');
            grid.classList.remove('categoria-oculta');
        }
    }

    filtrarCategoria('cat-yerbas');
    filtrarCategoria('cat-mates');
    filtrarCategoria('cat-termos');
    filtrarCategoria('cat-bombillas');
    filtrarCategoria('cat-yerbera');
    filtrarCategoria('cat-canastas');
}

// --- 9. CONEXIÓN DIRECTA CON GOOGLE SHEETS (SIN LÍMITES) ---
const LINK_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT4hUnxOnSWRy5zB8-N8CoUbiajbB2eqvFXXMLrgxx-xmM2Zr6YHqCKS2xo_malGOTWigtES3DNvIw2/pub?gid=0&single=true&output=csv";

async function cargarStockDesdeExcel() {
    try {
        let respuesta = await fetch(LINK_CSV);
        let datosCsv = await respuesta.text();
        let filas = datosCsv.split('\n');

        // Detectar la columna de precio basándose en el header
        let headers = filas[0].split(',').map(h => h.trim().toLowerCase());
        let colId = 0;         // Columna del ID (stock-XX)
        let colPrecio = -1;    // Columna del precio

        // Buscar la columna que contenga "precio"
        for (let h = 0; h < headers.length; h++) {
            if (headers[h].includes('precio')) {
                colPrecio = h;
                break;
            }
        }
        // Si no encuentra "precio", usar columna 2 por defecto
        if (colPrecio === -1) colPrecio = 2;

        for (let i = 1; i < filas.length; i++) {
            let fila = filas[i].trim();
            if (!fila) continue;

            let columnas = fila.split(',');
            if (columnas.length < colPrecio + 1) continue;

            let idProducto = columnas[colId].trim();
            if (!idProducto.startsWith('stock-')) continue;

            // Limpiar el precio: quitar $, puntos de miles, espacios
            let precioRaw = columnas[colPrecio].trim();
            precioRaw = precioRaw.replace(/[$\s]/g, '');  // Quitar $ y espacios
            precioRaw = precioRaw.replace(/\./g, '');      // Quitar puntos de miles
            let precioNumero = parseInt(precioRaw) || 0;

            // Guardar en memoria para agregarAlCarrito
            preciosDesdeExcel[idProducto] = precioNumero;

            // Actualizar el elemento de precio en el HTML
            let idPrecio = idProducto.replace('stock', 'precio');
            let elementoPrecio = document.getElementById(idPrecio);

            if (elementoPrecio) {
                if (precioNumero > 0) {
                    elementoPrecio.innerText = '$' + precioNumero.toLocaleString('es-AR');
                } else {
                    elementoPrecio.innerText = 'Consultar';
                }
            }

            // Actualizar los botones "Agregar" que referencian este stock
            document.querySelectorAll(`button.btn-add`).forEach(btn => {
                let onclick = btn.getAttribute('onclick');
                if (onclick && onclick.includes("'" + idProducto + "'")) {
                    // Reemplazar el precio 0 con el precio real
                    btn.setAttribute('onclick', onclick.replace(/, \d+,/, ', ' + precioNumero + ','));
                }
            });
        }
        console.log("✅ Precios cargados desde Excel:", Object.keys(preciosDesdeExcel).length, "productos");

    } catch (error) {
        console.error("Error al leer el Excel directo:", error);
    }
}

// GESTOR DE NAVEGACIÓN (SPA)
function navigate() {
    let hash = window.location.hash || '#catalogo';
    let view = 'catalogo';

    if (hash === '#curado' || hash === '#guia') {
        view = 'curado';
    } else if (hash === '#faq' || hash === '#preguntas') {
        view = 'faq';
    } else if (hash === '#inicio') {
        view = 'catalogo';
    } else if (hash === '#productos' || hash.startsWith('#cat-')) {
        view = 'catalogo';
    }

    const viewCatalogo = document.getElementById('view-catalogo');
    const viewCurado = document.getElementById('view-curado');
    const viewFaq = document.getElementById('view-faq');

    if (viewCatalogo) viewCatalogo.style.display = (view === 'catalogo') ? 'block' : 'none';
    if (viewCurado) viewCurado.style.display = (view === 'curado') ? 'block' : 'none';
    if (viewFaq) viewFaq.style.display = (view === 'faq') ? 'block' : 'none';

    // Actualizar clase 'active' en los enlaces del menú
    document.querySelectorAll('#menu-links a, .footer-links a').forEach(link => {
        link.classList.remove('active');
        let href = link.getAttribute('href');
        if (href) {
            if (view === 'catalogo' && (href === '#inicio' || href === '#productos' || href === '#catalogo')) {
                link.classList.add('active');
            } else if (view === 'curado' && (href === '#curado' || href === '#guia')) {
                link.classList.add('active');
            } else if (view === 'faq' && href === '#faq') {
                link.classList.add('active');
            }
        }
    });

    if (hash === '#inicio') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (hash === '#productos') {
        const prodSection = document.getElementById('productos');
        if (prodSection) prodSection.scrollIntoView({ behavior: 'smooth' });
    } else if (hash === '#contacto') {
        const contactSection = document.getElementById('contacto');
        if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth' });
    } else if (hash === '#curado' || hash === '#guia') {
        const curadoSection = document.getElementById('guia');
        if (curadoSection) {
            setTimeout(() => {
                curadoSection.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    } else if (hash === '#faq' || hash === '#preguntas') {
        const faqSection = document.getElementById('preguntas-frecuentes');
        if (faqSection) {
            setTimeout(() => {
                faqSection.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    } else if (hash.startsWith('#cat-')) {
        const categoryElement = document.getElementById(hash.substring(1));
        if (categoryElement) {
            setTimeout(() => {
                categoryElement.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    } else {
        window.scrollTo({ top: 0, behavior: 'auto' });
    }
}

document.addEventListener("DOMContentLoaded", function() {
    cargarStockDesdeExcel();

    // Iniciar navegación
    window.addEventListener('hashchange', navigate);
    navigate();

    // Acordeones interactivos FAQ
    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', () => {
            const faqItem = button.parentElement;
            const answer = button.nextElementSibling;
            
            document.querySelectorAll('.faq-item').forEach(item => {
                if (item !== faqItem) {
                    item.classList.remove('faq-activo');
                    const ans = item.querySelector('.faq-answer');
                    if (ans) ans.style.maxHeight = null;
                }
            });

            faqItem.classList.toggle('faq-activo');
            if (faqItem.classList.contains('faq-activo')) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
            } else {
                answer.style.maxHeight = null;
            }
        });
    });

    // 9. ANIMACIONES AL HACER SCROLL (Intersection Observer)
    const elementosAnimados = document.querySelectorAll('.animate-on-scroll');
    const observador = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
                observador.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    elementosAnimados.forEach(el => observador.observe(el));

    // 10. EFECTO NAVBAR AL SCROLL
    const navbar = document.getElementById('navbar-main');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 60) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
});

// 11. LIGHTBOX MODAL
let lightboxImages = [];
let lightboxCurrentIndex = 0;

function abrirLightbox(imgElement) {
    const modal = document.getElementById('lightbox-modal');
    const imgLightbox = document.getElementById('lightbox-img');
    const btnPrev = document.getElementById('lightbox-prev');
    const btnNext = document.getElementById('lightbox-next');
    
    if (modal && imgLightbox) {
        if (imgElement.hasAttribute('data-images')) {
            lightboxImages = JSON.parse(imgElement.getAttribute('data-images'));
        } else {
            lightboxImages = [imgElement.src];
        }
        
        lightboxCurrentIndex = 0;
        
        // Copiamos el zoom y el foco para que se vea idéntico pero más grande
        imgLightbox.src = lightboxImages[lightboxCurrentIndex];
        imgLightbox.style.transform = imgElement.style.transform;
        imgLightbox.style.transformOrigin = imgElement.style.transformOrigin;
        
        if (btnPrev && btnNext) {
            if (lightboxImages.length > 1) {
                btnPrev.style.display = 'flex';
                btnNext.style.display = 'flex';
            } else {
                btnPrev.style.display = 'none';
                btnNext.style.display = 'none';
            }
        }
        
        modal.classList.add('mostrar');
        document.body.style.overflow = 'hidden'; // Evita scrollear el fondo
    }
}

function cambiarImagenLightbox(direccion, event) {
    if (event) event.stopPropagation(); // Evitar cerrar el lightbox
    lightboxCurrentIndex += direccion;
    
    if (lightboxCurrentIndex >= lightboxImages.length) {
        lightboxCurrentIndex = 0;
    } else if (lightboxCurrentIndex < 0) {
        lightboxCurrentIndex = lightboxImages.length - 1;
    }
    
    const imgLightbox = document.getElementById('lightbox-img');
    imgLightbox.src = lightboxImages[lightboxCurrentIndex];
    // Resetear el zoom a normal al cambiar foto
    imgLightbox.style.transform = 'scale(1)';
    imgLightbox.style.transformOrigin = 'center center';
}

function cerrarLightbox() {
    const modal = document.getElementById('lightbox-modal');
    if (modal) {
        modal.classList.remove('mostrar');
        document.body.style.overflow = ''; // Vuelve a permitir scroll
    }
}

// Cerrar lightbox con la tecla ESC o navegar con flechas
document.addEventListener('keydown', function(event) {
    const modal = document.getElementById('lightbox-modal');
    if (modal && modal.classList.contains('mostrar')) {
        if (event.key === "Escape") {
            cerrarLightbox();
        } else if (event.key === "ArrowLeft" && lightboxImages.length > 1) {
            cambiarImagenLightbox(-1);
        } else if (event.key === "ArrowRight" && lightboxImages.length > 1) {
            cambiarImagenLightbox(1);
        }
    }
});