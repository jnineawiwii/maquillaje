// Datos de productos (backup por si Firebase falla)
const productosBackup = [
    {
        id: 1,
        nombre: "Labial Matte Premium",
        precio: 25.99,
        categoria: "labios",
        icono: "💄"
    },
    {
        id: 2,
        nombre: "Paleta de Sombras", 
        precio: 45.50,
        categoria: "ojos",
        icono: "🎨"
    },
    {
        id: 3,
        nombre: "Base Líquida",
        precio: 32.75,
        categoria: "rostro",
        icono: "💧"
    }
];

// Carrito
let carrito = [];
let total = 0;
let productos = [];

// Elementos DOM
let productGrid; // Se asignará dinámicamente
const cartCount = document.querySelector('.cart-count');
const cartModal = document.getElementById('carrito-modal');
const cartItems = document.getElementById('cart-items');
const totalPrice = document.getElementById('total-price');
const closeModal = document.querySelector('.close');
const checkoutBtn = document.querySelector('.checkout-btn');

// Inicializar la tienda

// Cargar productos desde Firebase
async function cargarProductosDesdeFirebase() {
    try {
        console.log("Cargando productos desde Firebase...");
        
        const querySnapshot = await db.collection('products').get();
        
        if (querySnapshot.empty) {
            console.log("No hay productos en Firebase, agregando productos de ejemplo...");
            await agregarProductosEjemplo();
            return;
        }

        productos = [];
        querySnapshot.forEach((doc) => {
            const productData = doc.data();
            productos.push({
                id: doc.id, // Usar el ID de Firebase
                nombre: productData.name || productData.nombre,
                precio: productData.price || productData.precio,
                categoria: productData.category || productData.categoria,
                icono: obtenerIconoCategoria(productData.category || productData.categoria),
                descripcion: productData.description || productData.descripcion,
                imagen: productData.image || productData.imagen
            });
        });

        console.log("Productos cargados desde Firebase:", productos);

        // FIX: Update UI immediately after data loads to prevent race condition
        cargarProductosEnGrid(); 

    } catch (error) {
        console.error("Error cargando productos desde Firebase:", error);
        console.log("Usando productos de backup...");
        productos = productosBackup;
    }
}

// Agregar productos de ejemplo a Firebase
async function agregarProductosEjemplo() {
    const productosEjemplo = [
        {
            name: "Labial Matte Premium",
            price: 25.99,
            category: "labios",
            description: "Labial de acabado mate y larga duración"
        },
        {
            name: "Paleta de Sombras",
            price: 45.50, 
            category: "ojos",
            description: "Paleta con 12 colores profesionales"
        },
        {
            name: "Base Líquida",
            price: 32.75,
            category: "rostro",
            description: "Base de cobertura media y acabado natural"
        },
        {
            name: "Rímel Volumizador",
            price: 18.99,
            category: "ojos", 
            description: "Rímel para pestañas voluminosas"
        },
        {
            name: "Rubor en Polvo",
            price: 22.50,
            category: "rostro",
            description: "Rubor en polvo de larga duración"
        },
        {
            name: "Delineador Líquido",
            price: 15.25,
            category: "ojos",
            description: "Delineador de precisión y rápido secado"
        }
    ];

    try {
        for (const producto of productosEjemplo) {
            await db.collection('products').add(producto);
        }
        console.log("Productos de ejemplo agregados a Firebase");
        // Recargar productos
        cargarProductosDesdeFirebase();
    } catch (error) {
        console.error("Error agregando productos de ejemplo:", error);
    }
}

// Obtener icono según categoría
function obtenerIconoCategoria(categoria) {
    const iconos = {
        'labios': '💄',
        'ojos': '👁️',
        'rostro': '✨'
    };
    return iconos[categoria] || '🎁';
}

// Cargar productos en la grid
function cargarProductosEnGrid(filtroCategoria = null, terminoBusqueda = null) {
    productGrid = document.getElementById('products-grid');
    if (!productGrid) {
        // console.log("No hay cuadrícula de productos en esta vista.");
        return;
    }

    let productosAMostrar = productos;
    if (filtroCategoria && filtroCategoria !== 'all') productosAMostrar = productos.filter(p => p.categoria === filtroCategoria);
    if (terminoBusqueda) productosAMostrar = productos.filter(p => p.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()));
    
    productos.forEach(producto => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        const imagen = producto.imagen ? 
            `<img src="${producto.imagen}" alt="${producto.nombre}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">` :
            `<div class="product-image">${producto.icono}</div>`;
        
        productCard.innerHTML = `
            ${imagen}
            <h3>${producto.nombre}</h3>
            <p class="product-category">${producto.categoria}</p>
            <p class="product-price">$${producto.precio.toFixed(2)}</p>
            <button class="add-to-cart" onclick="agregarAlCarrito('${producto.id}')">
                Agregar al Carrito
            </button>
        `;
        productGrid.appendChild(productCard);
    });
}

// Funciones del carrito
function agregarAlCarrito(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) {
        console.error("Producto no encontrado:", id);
        return;
    }

    const itemExistente = carrito.find(item => item.id === id);
    
    if (itemExistente) {
        itemExistente.cantidad++;
    } else {
        carrito.push({ 
            ...producto, 
            cantidad: 1,
            precio: typeof producto.precio === 'number' ? producto.precio : parseFloat(producto.precio)
        });
    }
    
    actualizarCarrito();
    mostrarNotificacion(`${producto.nombre} agregado al carrito`);
    toggleCart(true); // Explicitly open cart drawer when item is added
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    actualizarCarrito();
    // When removing, we just update the view, not necessarily open it.
    // If the drawer is open, it will refresh.
    if (document.getElementById('cart-drawer').classList.contains('cart-open')) {
        mostrarCarrito();
    }
}

function actualizarCarrito() {
    // 1. Guardar en LocalStorage
    localStorage.setItem('carrito', JSON.stringify(carrito));
    
    // 2. Actualizar la UI (Contador y Lista)
    actualizarContadorCarrito();
}

function actualizarContadorCarrito() {
    // Actualizar contador
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
    
    // Actualizar items del carrito
    mostrarCarrito();
}

function mostrarCarrito() {
    const drawerCartItems = document.getElementById('drawer-cart-items');
    const drawerTotalPrice = document.getElementById('drawer-total-price');
    if (!drawerCartItems || !drawerTotalPrice) return;

    drawerCartItems.innerHTML = '';
    total = 0;

    if (carrito.length === 0) {
        drawerCartItems.innerHTML = '<p style="text-align: center; opacity: 0.7;">Tu carrito está vacío</p>';
        drawerTotalPrice.textContent = '$0.00 MXN';
        return;
    }

    carrito.forEach(item => {
        const itemTotal = item.precio * item.cantidad;
        total += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'drawer-cart-item';
        cartItem.innerHTML = `
            <img src="${item.imagen || 'images/placeholder.png'}" alt="${item.nombre}">
            <div style="flex-grow: 1;">
                <h4 style="margin: 0 0 5px 0; font-size: 1rem;">${item.nombre}</h4>
                <p style="margin: 0; font-size: 0.9rem; opacity: 0.8;">$${item.precio.toFixed(2)} x ${item.cantidad}</p>
            </div>
            <div style="text-align: right;">
                <p style="margin: 0 0 5px 0; font-weight: bold;">$${itemTotal.toFixed(2)}</p>
                <button onclick="eliminarDelCarrito('${item.id}')" style="color: #ff6b6b; border: none; background: none; cursor: pointer; font-size: 1rem;">
                    Eliminar
                </button>
            </div>
        `;
        drawerCartItems.appendChild(cartItem);
    });

    drawerTotalPrice.textContent = `$${total.toFixed(2)} MXN`;
}

function toggleCart(show) {
    document.getElementById('cart-overlay').classList.toggle('cart-open', show);
    document.getElementById('cart-drawer').classList.toggle('cart-open', show);
}

function finalizarCompra() {
    const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    if (carrito.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }
    
    mostrarNotificacion(`¡Gracias por tu compra! Total: $${total.toFixed(2)}`);
    carrito = [];
    actualizarCarrito();
    toggleCart(false);
}

function mostrarNotificacion(mensaje) {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 3000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.textContent = mensaje;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
}

function agregarEstilosNotificacion() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

function handleAuthStateChange(usuario) {
    const userInfo = document.getElementById('user-info');
    const authLinks = document.getElementById('auth-links');
    const adminLink = document.getElementById('admin-link');
    const cartLink = document.getElementById('cart-link');

    if (usuario) {
        if (userInfo) userInfo.style.display = 'block';
        if (cartLink) cartLink.style.display = 'block';
        if (document.getElementById('user-welcome')) document.getElementById('user-welcome').textContent = `Hola, ${usuario.email}`;
        if (authLinks) authLinks.innerHTML = '<a href="#" onclick="logout()">Cerrar Sesión</a>';

        if (typeof db !== 'undefined') {
            db.collection('users').doc(usuario.uid).get().then(doc => {
                if (doc.exists && doc.data().role === 'admin' && adminLink) {
                    adminLink.style.display = 'block';
                }
            });
        }
    } else {
        if (userInfo) userInfo.style.display = 'none';
        if (cartLink) cartLink.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
        if (authLinks) authLinks.innerHTML = `
            <a href="#login">Iniciar Sesión</a>
            <a href="#register">Registrarse</a>
        `;
    }
}

function logout() {
    if (typeof auth !== 'undefined') {
        auth.signOut();
    }
    if (typeof srAnnounce === 'function') {
        srAnnounce('Sesión cerrada');
    }
    window.location.hash = 'home';
}

// ====================================================================
// SISTEMA DE RUTAS
// ====================================================================
function handleRoute() {
    const contenido = document.getElementById('page-content');
    if (!contenido) return;

    const hash = window.location.hash.substring(1);
    let pagina = 'home';
    let parametros = {};

    if (hash.includes('?')) {
        const parts = hash.split('?');
        pagina = parts[0];
        const searchParams = new URLSearchParams(parts[1]);
        parametros = Object.fromEntries(searchParams.entries());
    } else if (hash) {
        pagina = hash;
    }

    switch (pagina) {
        case 'home':
            // El video hero ahora es estático en index.html.
            // Esta ruta solo se encarga de limpiar el contenido de la página y cargar productos si es necesario.
            contenido.innerHTML = `
                <section class="hero">
                    <video autoplay loop muted playsinline class="hero-video" src="videos/intro.mp4"></video>
                    <div class="hero-content">
                        <a href="#products" class="cta-button">Ver Productos</a>
                    </div>
                </section>
                <section class="products">
                    <div class="container">
                        <h2>Ofertas Especiales</h2>
                        <div id="products-grid" class="product-grid"></div>
                    </div>
                </section>
            `;
            cargarProductosEnGrid();
            break;

        case 'products':
            const categoria = parametros.category || 'all';
            const terminoBusqueda = parametros.search || '';
            contenido.innerHTML = `
                <section class="products">
                    <div class="container">
                        <h2>Nuestros Productos</h2>
                        <div class="filters">
                            <button onclick="filtrarProductos('all')" class="filter-btn ${categoria === 'all' ? 'active' : ''}">Todos</button>
                            <button onclick="filtrarProductos('labios')" class="filter-btn ${categoria === 'labios' ? 'active' : ''}">Labios</button>
                            <button onclick="filtrarProductos('ojos')" class="filter-btn ${categoria === 'ojos' ? 'active' : ''}">Ojos</button>
                            <button onclick="filtrarProductos('rostro')" class="filter-btn ${categoria === 'rostro' ? 'active' : ''}">Rostro</button>
                        </div>
                        ${terminoBusqueda ? `<div class="search-results-info"><h3>Resultados para: <strong>"${terminoBusqueda}"</strong></h3></div>` : ''}
                        <div id="products-grid" class="product-grid"></div>
                    </div>
                </section>
            `;
            cargarProductosEnGrid(categoria, terminoBusqueda);
            break;

        case 'login':
            contenido.innerHTML = `
                <div style="position: fixed; top: 70px; left: 0; width: 100vw; height: calc(100vh - 70px); margin: 0; padding: 0; overflow: hidden; z-index: 500; background: black;">
                    <iframe src="login.html" style="width: 100%; height: 100%; border: none; display: block;"></iframe>
                </div>
            `;
            break;

        case 'guide':
            const pageTitle = 'Guía de Usuario';
            contenido.innerHTML = `
                <section class="page-section">
                    <h1>${pageTitle}</h1>
                    <iframe src="${pagina}.html" style="width: 100%; height: 600px; border: none; border-radius: 8px;"></iframe>
                </section>
            `;
            break;
        
        case 'register':
            contenido.innerHTML = `
                <div style="position: fixed; top: 70px; left: 0; width: 100vw; height: calc(100vh - 70px); margin: 0; padding: 0; overflow: hidden; z-index: 500; background: black;">
                    <iframe src="register.html" style="width: 100%; height: 100%; border: none; display: block;"></iframe>
                </div>
            `;
            break;

        default:
            handleRoute('home');
    }
}

function filtrarProductos(categoria) {
    window.location.hash = `products${categoria !== 'all' ? `?category=${categoria}` : ''}`;
}

// --- Reconocimiento de Voz para Búsqueda ---
let recognition;
let isRecognizing = false;

function inicializarReconocimientoVoz() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn('El reconocimiento de voz no es compatible.');
        const voiceBtn = document.getElementById('voice-search-btn');
        if (voiceBtn) voiceBtn.style.display = 'none';
        return;
    }
    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        document.getElementById('search-input').value = speechResult;
        buscarProductos(new Event('submit'));
    };
    recognition.onend = () => { isRecognizing = false; };
}

function toggleReconocimientoVoz() {
    if (!recognition) return;
    if (isRecognizing) {
        recognition.stop();
    } else {
        recognition.start();
        isRecognizing = true;
    }
}

// ====================================================================
// FUNCIONES DE ACCESIBILIDAD Y DROPDOWN (Extraídas de base.html)
// ====================================================================

function srAnnounce(msg, politeness = 'polite', visualFeedback = true) {
    const el = document.getElementById('sr-announcer');
    if (el) {
        el.setAttribute('aria-live', politeness);
        el.textContent = '';
        setTimeout(() => el.textContent = msg, 100);
    }
    
    if (visualFeedback) {
        const visualEl = document.getElementById('sr-visual-announcer');
        if (visualEl) {
            visualEl.textContent = msg;
            visualEl.classList.add('show');
            setTimeout(() => {
                visualEl.classList.remove('show');
            }, 3000);
        }
    }
}

function inicializarControlesAccesibilidad() {
    // Tamaño de fuente
    const fontSizeRange = document.getElementById('fontSizeRange');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const fontSizeReset = document.getElementById('fontSizeReset');
    
    if (fontSizeRange) {
        fontSizeRange.addEventListener('input', function() {
            const newSize = this.value + 'px';
            document.documentElement.style.fontSize = newSize;
            fontSizeValue.textContent = newSize;
            srAnnounce(`Tamaño de fuente cambiado a ${newSize}`);
        });
        
        fontSizeReset.addEventListener('click', function() {
            fontSizeRange.value = 16;
            document.documentElement.style.fontSize = '16px';
            fontSizeValue.textContent = '16px';
            srAnnounce('Tamaño de fuente restablecido');
        });
    }
    
    // Espaciado
    const spacingRange = document.getElementById('spacingRange');
    const spacingValue = document.getElementById('spacingValue');
    const spacingReset = document.getElementById('spacingReset');
    
    if (spacingRange) {
        spacingRange.addEventListener('input', function() {
            const newSpacing = this.value;
            document.documentElement.style.setProperty('--base-line-height', newSpacing);
            spacingValue.textContent = newSpacing;
            srAnnounce(`Interlineado cambiado a ${newSpacing}`);
        });
        
        spacingReset.addEventListener('click', function() {
            spacingRange.value = 1.6;
            document.documentElement.style.setProperty('--base-line-height', '1.6');
            spacingValue.textContent = '1.6';
            srAnnounce('Interlineado restablecido');
        });
    }
    
    // Alto contraste
    const toggleContrastBtn = document.getElementById('toggleContrastBtn');
    
    if (toggleContrastBtn) {
        toggleContrastBtn.addEventListener('click', function() {
            document.body.classList.toggle('high-contrast');
            const isActive = document.body.classList.contains('high-contrast');
            this.textContent = isActive ? 'Desactivar alto contraste' : 'Alto contraste';
            srAnnounce(isActive ? 'Alto contraste activado' : 'Alto contraste desactivado');
        });
    }
    
    // Escala de grises
    const grayscaleRange = document.getElementById('grayscaleRange');
    const grayscaleValue = document.getElementById('grayscaleValue');
    const grayscaleReset = document.getElementById('grayscaleReset');
    
    if (grayscaleRange) {
        grayscaleRange.addEventListener('input', function() {
            document.documentElement.style.setProperty('--grayscale-percent', this.value + '%');
            grayscaleValue.textContent = this.value + '%';
            document.body.classList.toggle('grayscale', this.value > 0);
            srAnnounce(`Escala de grises al ${this.value}%`);
        });
        
        grayscaleReset.addEventListener('click', function() {
            grayscaleRange.value = 0;
            document.documentElement.style.setProperty('--grayscale-percent', '0%');
            grayscaleValue.textContent = '0%';
            document.body.classList.remove('grayscale');
            srAnnounce('Escala de grises restablecida');
        });
    }
    
    // Navegación por voz automática
    const srToggleBtnMenu = document.getElementById('srToggleBtnMenu');

    if (srToggleBtnMenu) {
        if (!('speechSynthesis' in window)) {
            srToggleBtnMenu.style.display = 'none';
        } else {
            srToggleBtnMenu.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleNavegacionPorVoz();
            });
        }
    }
    
    // Modo oscuro
    const themeToggleBtnMenu = document.getElementById('themeToggleBtnMenu');
    
    if (themeToggleBtnMenu) {
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
            themeToggleBtnMenu.textContent = 'Cambiar a modo claro';
        }
        
        themeToggleBtnMenu.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            this.textContent = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
            localStorage.setItem('darkMode', isDark);
            srAnnounce(isDark ? 'Modo oscuro activado' : 'Modo claro activado');
        });
    }
}

function inicializarDropdownAccesible() {
    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdownContent = document.querySelector('.dropdown-content');
    
    if (!dropdownBtn || !dropdownContent) return;
    
    function toggleDropdown(show) {
        const isOpen = typeof show === 'boolean' ? show : !dropdownContent.classList.contains('show');
        dropdownContent.classList.toggle('show', isOpen);
        dropdownBtn.setAttribute('aria-expanded', isOpen);
    }
    
    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
    });
    
    document.addEventListener('click', (e) => {
        if (!dropdownBtn.contains(e.target) && !dropdownContent.contains(e.target)) {
            toggleDropdown(false);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dropdownContent.classList.contains('show')) {
            toggleDropdown(false);
            dropdownBtn.focus();
        }
    });
}

let isVoiceNavigationActive = false;

function inicializarNavegacionPorVoz() {
    if (!('speechSynthesis' in window)) {
        console.warn('❌ La síntesis de voz no es compatible con este navegador');
        const srToggleBtnMenu = document.getElementById('srToggleBtnMenu');
        if (srToggleBtnMenu) {
            srToggleBtnMenu.style.display = 'none';
        }
    }
}

function toggleNavegacionPorVoz() {
    isVoiceNavigationActive = !isVoiceNavigationActive;
    const btn = document.getElementById('srToggleBtnMenu');
    if (isVoiceNavigationActive) {
        if (btn) btn.textContent = 'Desactivar navegación por voz';
        srAnnounce('Navegación por voz activada.', 'assertive');
    } else {
        if (btn) btn.textContent = 'Navegación por voz';
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        srAnnounce('Navegación por voz desactivada', 'assertive');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cargarProductosDesdeFirebase();
    actualizarContadorCarrito();

    // Sistema de rutas
    window.addEventListener('hashchange', handleRoute);
    handleRoute(); // Cargar la ruta inicial

    // Inicializar componentes de accesibilidad y UI
    inicializarDropdownAccesible();
    inicializarControlesAccesibilidad();
    inicializarNavegacionPorVoz();
    inicializarReconocimientoVoz();

    // Conectar botón de búsqueda por voz
    const voiceBtn = document.getElementById('voice-search-btn');
    if (voiceBtn) {
        voiceBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleReconocimientoVoz();
        });
    }

    // Auth state
    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged(handleAuthStateChange);
    }

    // Agregar estilos para notificación
    agregarEstilosNotificacion();

    // --- Cart Drawer Listeners ---
    const cartIconLink = document.querySelector('.cart-icon');
    if (cartIconLink) {
        cartIconLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleCart(true);
        });
    }

    document.getElementById('cart-overlay').addEventListener('click', () => toggleCart(false));
    document.getElementById('close-drawer-btn').addEventListener('click', () => toggleCart(false));
    document.getElementById('drawer-checkout-btn').addEventListener('click', finalizarCompra);

    mostrarCarrito(); // Initial render for the drawer
});

// Función para buscar productos (se activa con onsubmit del form)
function buscarProductos(event) {
    event.preventDefault();
    const termino = document.getElementById('search-input').value.trim();
    if (termino) {
        window.location.hash = `#products?search=${encodeURIComponent(termino)}`;
    }
}