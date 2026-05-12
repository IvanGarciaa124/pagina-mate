let carrito = [];
let totalPesos = 0;
let cantidadTotalItems = 0;
let preciosDesdeExcel = {}; // <-- MEMORIA PARA LOS PRECIOS

// 1. SUMAR AL CARRITO
function agregarAlCarrito(nombreProducto, precioOriginal, idStock) {
    let precioReal = preciosDesdeExcel[idStock] ? preciosDesdeExcel[idStock] : precioOriginal;
    let elementoStock = document.getElementById(idStock);
    let stockActual = parseInt(elementoStock.innerText);

    if (stockActual > 0) {
        stockActual--;
        elementoStock.innerText = stockActual;

        let productoExistente = carrito.find(item => item.nombre === nombreProducto);

        if (productoExistente) {
            productoExistente.cantidad++;
        } else {
            carrito.push({ 
                nombre: nombreProducto, 
                precioUnitario: precioReal,
                cantidad: 1, 
                stockReferencia: idStock 
            });
        }
        
        totalPesos += precioReal;
        cantidadTotalItems++; 
        actualizarVisualCarrito();
        
        let modal = document.getElementById('modal-carrito');
        modal.classList.add('carrito-visible');

    } else {
        let cartel = document.getElementById('toast-stock');
        if(cartel) {
            cartel.innerText = "¡Uy! Nos quedamos sin stock de " + nombreProducto;
            cartel.classList.add('mostrar');
            setTimeout(() => { cartel.classList.remove('mostrar'); }, 3000);
        }
    }
}

// 2. ELIMINAR DEL CARRITO
function eliminarDelCarrito(indice) {
    let producto = carrito[indice];

    let elementoStock = document.getElementById(producto.stockReferencia);
    let stockActual = parseInt(elementoStock.innerText);
    elementoStock.innerText = stockActual + 1;

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

// --- 8. CONEXIÓN DIRECTA CON GOOGLE SHEETS (SIN LÍMITES) ---
const LINK_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT4hUnxOnSWRy5zB8-N8CoUbiajbB2eqvFXXMLrgxx-xmM2Zr6YHqCKS2xo_malGOTWigtES3DNvIw2/pub?gid=0&single=true&output=csv";

async function cargarStockDesdeExcel() {
    try {
        let respuesta = await fetch(LINK_CSV);
        let datosCsv = await respuesta.text();
        let filas = datosCsv.split('\n');

        for (let i = 1; i < filas.length; i++) {
            let columnas = filas[i].split(',');
            if (columnas.length < 4) continue;

            let idProducto = columnas[0].trim();
            let precioProducto = columnas[2].trim();
            let stockProducto = columnas[3].trim();

            let elementoStock = document.getElementById(idProducto);
            if (elementoStock) {
                elementoStock.innerText = stockProducto;
            }

            if (precioProducto) {
                preciosDesdeExcel[idProducto] = parseInt(precioProducto);
                let idPrecio = idProducto.replace('stock', 'precio');
                let elementoPrecio = document.getElementById(idPrecio);

                if (elementoPrecio) {
                    elementoPrecio.innerText = '$' + parseInt(precioProducto).toLocaleString('es-AR');
                }
            }
        }
        console.log("¡Conexión directa y sin límites activada!");

    } catch (error) {
        console.error("Error al leer el Excel directo:", error);
    }
}

document.addEventListener("DOMContentLoaded", function() {
    cargarStockDesdeExcel();

    // 9. ANIMACIONES AL HACER SCROLL (Intersection Observer)
    const elementosAnimados = document.querySelectorAll('.animate-on-scroll');
    const observador = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Delay escalonado para que aparezcan uno tras otro
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
function abrirLightbox(imgElement) {
    const modal = document.getElementById('lightbox-modal');
    const imgLightbox = document.getElementById('lightbox-img');
    if (modal && imgLightbox) {
        imgLightbox.src = imgElement.src;
        // Copiamos el zoom y el foco para que se vea idéntico pero más grande
        imgLightbox.style.transform = imgElement.style.transform;
        imgLightbox.style.transformOrigin = imgElement.style.transformOrigin;
        
        modal.classList.add('mostrar');
        document.body.style.overflow = 'hidden'; // Evita scrollear el fondo
    }
}

function cerrarLightbox() {
    const modal = document.getElementById('lightbox-modal');
    if (modal) {
        modal.classList.remove('mostrar');
        document.body.style.overflow = ''; // Vuelve a permitir scroll
    }
}

// Cerrar lightbox con la tecla ESC
document.addEventListener('keydown', function(event) {
    if (event.key === "Escape") {
        cerrarLightbox();
    }
});