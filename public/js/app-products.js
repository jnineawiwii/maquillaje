// ==================== 📦 VARIABLES GLOBALES ====================
let productos = [];
let carrito = [];

// ==================== 🛍️ FUNCIONES DE PRODUCTOS ====================

// Cargar productos desde Firestore
async function cargarProductosDesdeFirebase() {
    try {
        console.log("🔄 Iniciando carga de productos...");
        
        const productGrid = document.getElementById('product-grid');
        productGrid.innerHTML = '<div class="loading">Buscando productos...</div>';

        const querySnapshot = await db.collection('products').get();
        console.log(`✅ Encontrados ${querySnapshot.size} productos`);

        if (querySnapshot.empty) {
            productGrid.innerHTML = '<div class="loading">No hay productos en la base de datos</div>';
            return;
        }

        productos = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log("📦 Producto crudo:", data);
            
            const producto = {
                id: doc.id,
                nombre: data.name || data.nombre || "Producto sin nombre",
                precio: validarPrecio(data.price || data.precio),
                categoria: data.category || data.categoria || "general",
                descripcion: data.description || data.descripcion || "",
                imagen: validarImagen(data.image || data.imagen)
            };
            
            productos.push(producto);
        });

        console.log("🎉 Productos procesados:", productos);
        mostrarProductos(productos);

    } catch (error) {
        console.error("❌ Error:", error);
        document.getElementById('product-grid').innerHTML = `
            <div class="loading error">
                Error: ${error.message}
                <button onclick="cargarProductosDesdeFirebase()">Reintentar</button>
            </div>
        `;
    }
}

// Validar precio
function validarPrecio(precio) {
    if (typeof precio === 'number') return precio;
    if (typeof precio === 'string') return parseFloat(precio) || 0;
    return 0;
}

// Validar imagen
function validarImagen(imagen) {
    if (!imagen || imagen.includes('placeholder.com')) {
        return null;
    }
    return imagen;
}

// Mostrar productos en la grid
function mostrarProductos(productosArray) {
    const productGrid = document.getElementById('product-grid');
    productGrid.innerHTML = '';

    productosArray.forEach(producto => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        const icono = obtenerIcono(producto.categoria);
        const imagen = producto.imagen ? 
            `<img src="${producto.imagen}" alt="${producto.nombre}" class="product-image" onerror="this.remove(); this.nextElementSibling.style.display='block'">
             <div class="product-image" style="display:none">${icono}</div>` :
            `<div class="product-image">${icono}</div>`;

        card.innerHTML = `
            ${imagen}
            <h3>${producto.nombre}</h3>
            <p class="product-category">${producto.categoria}</p>
            <p class="product-price">$${producto.precio.toFixed(2)}</p>
            ${producto.descripcion ? `<p class="product-description">${producto.descripcion}</p>` : ''}
            <button class="add-to-cart" onclick="agregarAlCarrito('${producto.id}')">
                Agregar al Carrito
            </button>
        `;
        productGrid.appendChild(card);
    });
}

// Obtener icono por categoría
function obtenerIcono(categoria) {
    const iconos = {
        'labios': '💄',
        'ojos': '👁️', 
        'rostro': '✨',
        'general': '🎁'
    };
    return iconos[categoria] || '🎁';
}

// ==================== 🛒 FUNCIONES DEL CARRITO ====================

// Función para agregar al carrito
function agregarAlCarrito(productoId) {
    console.log("🛒 Intentando agregar producto:", productoId);
    
    const producto = productos.find(p => p.id === productoId);
    
    if (!producto) {
        console.error("❌ Producto no encontrado:", productoId);
        alert("Error: Producto no encontrado");
        return;
    }

    const productoEnCarrito = carrito.find(item => item.id === productoId);
    
    if (productoEnCarrito) {
        productoEnCarrito.cantidad++;
    } else {
        carrito.push({
            ...producto,
            cantidad: 1
        });
    }
    
    actualizarCarrito();
    mostrarNotificacion(`✅ ${producto.nombre} agregado al carrito`);
}

// Función para eliminar del carrito
function eliminarDelCarrito(productoId) {
    carrito = carrito.filter(item => item.id !== productoId);
    actualizarCarrito();
}

// Actualizar interfaz del carrito
function actualizarCarrito() {
    const cartCount = document.querySelector('.cart-count');
    const cartItems = document.getElementById('cart-items');
    const totalPrice = document.getElementById('total-price');
    
    // Actualizar contador
    if (cartCount) {
        const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        cartCount.textContent = totalItems;
    }
    
    // Actualizar items del carrito
    if (cartItems && totalPrice) {
        cartItems.innerHTML = '';
        let total = 0;
        
        if (carrito.length === 0) {
            cartItems.innerHTML = '<p>Tu carrito está vacío</p>';
            totalPrice.textContent = '0.00';
            return;
        }
        
        carrito.forEach(item => {
            const itemTotal = item.precio * item.cantidad;
            total += itemTotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div>
                    <h4>${item.nombre}</h4>
                    <p>$${item.precio.toFixed(2)} x ${item.cantidad}</p>
                </div>
                <div>
                    <span>$${itemTotal.toFixed(2)}</span>
                    <button onclick="eliminarDelCarrito('${item.id}')" style="margin-left: 10px; color: red; border: none; background: none; cursor: pointer;">
                        🗑️
                    </button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
        
        totalPrice.textContent = total.toFixed(2);
    }
}

// Abrir carrito
function abrirCarrito(event) {
    if (event) event.preventDefault();
    const cartModal = document.getElementById('carrito-modal');
    if (cartModal) {
        cartModal.style.display = 'block';
        actualizarCarrito();
    }
}

// Cerrar carrito
function cerrarCarrito() {
    const cartModal = document.getElementById('carrito-modal');
    if (cartModal) {
        cartModal.style.display = 'none';
    }
}

// Finalizar compra
function finalizarCompra() {
    if (carrito.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }
    
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    alert(`¡Gracias por tu compra! Total: $${total.toFixed(2)}`);
    
    carrito = [];
    actualizarCarrito();
    cerrarCarrito();
}

// Mostrar notificación
function mostrarNotificacion(mensaje) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #e91e63;
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

// Agregar estilos para animaciones
function agregarEstilosAnimacion() {
    if (document.getElementById('carrito-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'carrito-styles';
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

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 Iniciando aplicación...");
    agregarEstilosAnimacion();
    cargarProductosDesdeFirebase();
    
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('carrito-modal');
        if (event.target === modal) {
            cerrarCarrito();
        }
    });
});