// Datos de productos (backup por si Firebase falla)


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

    productGrid.innerHTML = ''; // Limpiar grid antes de cargar

    let productosAMostrar = productos;
    if (filtroCategoria && filtroCategoria !== 'all') productosAMostrar = productos.filter(p => p.categoria === filtroCategoria);
    if (terminoBusqueda) productosAMostrar = productos.filter(p => p.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()));
    
    if (productosAMostrar.length === 0) {
        productGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; padding: 40px; opacity: 0.7;">No se encontraron productos</p>';
        return;
    }
    
    productosAMostrar.forEach(producto => {
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
        if (document.getElementById('user-welcome')) {
            document.getElementById('user-welcome').textContent = `Hola, ${usuario.email}`;
        }
        if (authLinks) authLinks.innerHTML = '<a href="#" onclick="logout()">Cerrar Sesión</a>';

        // Ocultar el iframe de login si está visible
        if (window.location.hash === '#login') {
            window.location.hash = 'home';
        }

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
// SISTEMA DE RUTAS - CORREGIDO
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
                <div class="auth-container">
                    <div class="auth-form">
                        <h2>Iniciar Sesión</h2>
                        
                        <div id="alert-container"></div>
                        
                        <form id="login-form">
                            <div class="form-group">
                                <label for="email">Correo electrónico:</label>
                                <input type="email" id="email" name="email" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="password">Contraseña:</label>
                                <input type="password" id="password" name="password" required>
                                <div class="password-toggle">
                                    <i class="fas fa-eye" id="toggle-password"></i>
                                </div>
                            </div>
                            
                            <div class="form-group captcha-container">
                                <canvas id="captcha-canvas" width="200" height="60"></canvas>
                                <button type="button" id="reload-captcha"><i class="fas fa-sync-alt"></i></button>
                                <input type="text" id="captcha-input" placeholder="Resuelve el captcha" required>
                            </div>
                            
                            <button type="submit" class="btn-primary" id="login-btn">
                                <span id="login-text">Iniciar Sesión</span>
                                <div id="login-spinner" class="spinner" style="display: none;"></div>
                            </button>
                        </form>
                        
                        <div class="auth-links">
                            <p>¿No tienes cuenta? <a href="#register">Regístrate aquí</a></p>
                            <p><a href="#forgot-password">¿Olvidaste tu contraseña?</a></p>
                        </div>

                        <div class="auth-separator">
                            <span>o</span>
                        </div>

                        <button type="button" class="btn-google" id="google-login-btn">
                            <i class="fab fa-google"></i>
                            Iniciar Sesión con Google
                        </button>
                    </div>
                </div>
            `;
            
            // Inicializar el formulario de login después de cargar el HTML
            setTimeout(() => {
                inicializarFormularioLogin();
            }, 100);
            break;

        case 'register':
            contenido.innerHTML = `
                <div class="auth-container">
                    <div class="auth-form">
                        <h2>Registrarse</h2>
                        <p style="text-align: center; color: #666; margin-bottom: 20px;">
                            Página de registro - Funcionalidad en desarrollo
                        </p>
                        <div class="auth-links">
                            <p>¿Ya tienes cuenta? <a href="#login">Inicia sesión aquí</a></p>
                        </div>
                    </div>
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

        case 'forgot-password':
            contenido.innerHTML = `
                <div class="auth-container">
                    <div class="auth-form">
                        <h2>Recuperar Contraseña</h2>
                        <p style="text-align: center; color: #666; margin-bottom: 20px;">
                            Funcionalidad de recuperación de contraseña en desarrollo
                        </p>
                        <div class="auth-links">
                            <p><a href="#login">Volver al inicio de sesión</a></p>
                        </div>
                    </div>
                </div>
            `;
            break;

        default:
            handleRoute('home');
    }
}

// ====================================================================
// FORMULARIO DE LOGIN INTEGRADO
// ====================================================================
function inicializarFormularioLogin() {
    // CAPTCHA
    const captchaCanvas = document.getElementById('captcha-canvas');
    const captchaInput = document.getElementById('captcha-input');
    const reloadBtn = document.getElementById('reload-captcha');
    
    if (!captchaCanvas || !captchaInput) return;
    
    const ctx = captchaCanvas.getContext('2d');
    let captchaAnswer = 0;

    function generarCaptcha() {
        ctx.clearRect(0, 0, captchaCanvas.width, captchaCanvas.height);

        const num1 = Math.floor(Math.random() * 20) + 1;
        const num2 = Math.floor(Math.random() * 20) + 1;
        captchaAnswer = num1 + num2;
        const captchaText = `${num1} + ${num2} = ?`;

        const grad = ctx.createLinearGradient(0, 0, captchaCanvas.width, captchaCanvas.height);
        grad.addColorStop(0, '#6a11cb');
        grad.addColorStop(1, '#2575fc');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, captchaCanvas.width, captchaCanvas.height);

        ctx.font = '28px Arial';
        ctx.fillStyle = '#fff';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText(captchaText, captchaCanvas.width / 2, captchaCanvas.height / 2);

        for (let i = 0; i < 5; i++) {
            ctx.strokeStyle = `rgba(255,255,255,${Math.random() * 0.3})`;
            ctx.beginPath();
            ctx.moveTo(Math.random() * captchaCanvas.width, Math.random() * captchaCanvas.height);
            ctx.lineTo(Math.random() * captchaCanvas.width, Math.random() * captchaCanvas.height);
            ctx.stroke();
        }

        for (let i = 0; i < 30; i++) {
            ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.5})`;
            ctx.beginPath();
            ctx.arc(Math.random() * captchaCanvas.width, Math.random() * captchaCanvas.height, 2, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    generarCaptcha();
    
    if (reloadBtn) {
        reloadBtn.addEventListener('click', function() {
            generarCaptcha();
            captchaInput.value = '';
        });
    }

    // Mostrar/ocultar contraseña
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // Manejar envío del formulario de LOGIN
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-btn');
    const loginText = document.getElementById('login-text');
    const loginSpinner = document.getElementById('login-spinner');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email')?.value;
            const password = document.getElementById('password')?.value;
            const captchaValue = parseInt(captchaInput.value);
            
            // Validaciones básicas
            if (!email || !password || !captchaValue) {
                showAlert('Por favor completa todos los campos', 'error');
                return;
            }

            // Validar CAPTCHA
            if (captchaValue !== captchaAnswer) {
                showAlert('Captcha incorrecto. Intenta de nuevo.', 'error');
                generarCaptcha();
                captchaInput.value = '';
                return;
            }

            // Mostrar loading
            if (loginText && loginSpinner && loginBtn) {
                loginText.style.display = 'none';
                loginSpinner.style.display = 'inline-block';
                loginBtn.disabled = true;
            }

            try {
                // Iniciar sesión en Firebase Auth
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // VERIFICAR ROL EN FIRESTORE
                const userDoc = await db.collection('users').doc(user.uid).get();

                if (!userDoc.exists) {
                    showAlert('Usuario no encontrado en la base de datos', 'error');
                    await auth.signOut();
                    return;
                }

                const userData = userDoc.data();
                const userRole = userData.role;

                // Mostrar mensaje de éxito
                showAlert(`¡Bienvenido/a de nuevo! Rol: ${userRole}`, 'success');

                // Redirigir según el rol - IMPORTANTE: Usar replace para evitar historial
setTimeout(() => {
    switch(userRole) {
        case 'masteradmin':
            window.location.replace('masteradmin/dashboard.html');
            break;
        case 'admin':
            window.location.replace('admin/dashboard.html');
            break;
        case 'customer':
        default:
            // REDIRIGIR A BASE.HTML en lugar de quedarse en index.html
            window.location.replace('base.html');
    }
}, 1500);

            } catch (error) {
                console.error('Error en inicio de sesión:', error);
                
                let errorMessage = 'Error al iniciar sesión';
                
                switch (error.code) {
                    case 'auth/invalid-email':
                        errorMessage = 'Correo electrónico inválido';
                        break;
                    case 'auth/user-disabled':
                        errorMessage = 'Esta cuenta ha sido deshabilitada';
                        break;
                    case 'auth/user-not-found':
                        errorMessage = 'No existe una cuenta con este correo';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Contraseña incorrecta';
                        break;
                    default:
                        errorMessage = error.message;
                }
                
                showAlert(errorMessage, 'error');
            } finally {
                // Ocultar loading
                if (loginText && loginSpinner && loginBtn) {
                    loginText.style.display = 'inline-block';
                    loginSpinner.style.display = 'none';
                    loginBtn.disabled = false;
                }
            }
        });
    }

    // Inicio de sesión con Google
    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async function() {
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                provider.addScope('email');
                provider.addScope('profile');

                // Mostrar loading
                googleLoginBtn.disabled = true;
                googleLoginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';

                const result = await auth.signInWithPopup(provider);
                const user = result.user;

                // Verificar si es un usuario nuevo
                const userDoc = await db.collection('users').doc(user.uid).get();
                
                if (!userDoc.exists) {
                    // Crear documento de usuario en Firestore
                    await db.collection('users').doc(user.uid).set({
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        role: 'customer',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        provider: 'google',
                        emailVerified: true
                    });
                }

                showAlert(`¡Bienvenido/a, ${user.displayName || user.email}!`, 'success');
                
                setTimeout(() => {
                    window.location.hash = 'home';
                    // Forzar recarga completa
                    setTimeout(() => {
                        window.location.reload();
                    }, 100);
                }, 1500);

            } catch (error) {
                console.error('Error en inicio de sesión con Google:', error);
                
                let errorMessage = 'Error al iniciar sesión con Google';
                if (error.code === 'auth/popup-closed-by-user') {
                    errorMessage = 'La ventana de inicio de sesión fue cancelada';
                } else if (error.code === 'auth/popup-blocked') {
                    errorMessage = 'El popup fue bloqueado. Por favor permite popups para este sitio';
                }
                
                showAlert(errorMessage, 'error');
                
                // Restaurar botón
                googleLoginBtn.disabled = false;
                googleLoginBtn.innerHTML = '<i class="fab fa-google"></i> Iniciar Sesión con Google';
            }
        });
    }
}

// Función para mostrar alertas en el login
function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    const alertClass = type === 'error' ? 'alert-error' : 
                       type === 'success' ? 'alert-success' : 'alert-warning';
    
    alertContainer.innerHTML = `
        <div class="alert ${alertClass}">
            <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 
                             type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
            ${message}
        </div>
    `;
    
    // Auto-eliminar alerta después de 8 segundos
    setTimeout(() => {
        if (alertContainer) {
            alertContainer.innerHTML = '';
        }
    }, 8000);
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
        window.location.hash = `products?search=${encodeURIComponent(termino)}`;
    }
}