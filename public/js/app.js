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
const productGrid = document.getElementById('product-grid');
const cartCount = document.querySelector('.cart-count');
const cartModal = document.getElementById('carrito-modal');
const cartItems = document.getElementById('cart-items');
const totalPrice = document.getElementById('total-price');
const closeModal = document.querySelector('.close');
const checkoutBtn = document.querySelector('.checkout-btn');

// Inicializar la tienda
document.addEventListener('DOMContentLoaded', () => {
    cargarProductosDesdeFirebase();
    actualizarCarrito();
    
    // Event listeners
    const cartIcon = document.querySelector('.cart-icon a');
    if (cartIcon) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            abrirCarrito();
        });
    }
    
    if (closeModal) closeModal.addEventListener('click', cerrarCarrito);
    if (checkoutBtn) checkoutBtn.addEventListener('click', finalizarCompra);
    
    // Cerrar modal al hacer click fuera
    window.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            cerrarCarrito();
        }
    });

    // Agregar estilos para notificación
    agregarEstilosNotificacion();
});

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
        cargarProductosEnGrid();

    } catch (error) {
        console.error("Error cargando productos desde Firebase:", error);
        console.log("Usando productos de backup...");
        productos = productosBackup;
        cargarProductosEnGrid();
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
function cargarProductosEnGrid() {
    if (!productGrid) {
        console.error("No se encontró el elemento product-grid");
        return;
    }

    productGrid.innerHTML = '';
    
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
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    actualizarCarrito();
}

function actualizarCarrito() {
    // Actualizar contador
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
    
    // Actualizar items del carrito
    if (cartItems) {
        cartItems.innerHTML = '';
        total = 0;
        
        if (carrito.length === 0) {
            cartItems.innerHTML = '<p>Tu carrito está vacío</p>';
            if (totalPrice) totalPrice.textContent = '0.00';
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
        
        if (totalPrice) {
            totalPrice.textContent = total.toFixed(2);
        }
    }
}

function abrirCarrito() {
    if (cartModal) {
        cartModal.style.display = 'block';
    }
}

function cerrarCarrito() {
    if (cartModal) {
        cartModal.style.display = 'none';
    }
}

function finalizarCompra() {
    if (carrito.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }
    
    alert(`¡Gracias por tu compra! Total: $${total.toFixed(2)}`);
    carrito = [];
    actualizarCarrito();
    cerrarCarrito();
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

// Función para buscar productos
function buscarProductos(termino) {
    const productosFiltrados = productos.filter(producto =>
        producto.nombre.toLowerCase().includes(termino.toLowerCase()) ||
        producto.categoria.toLowerCase().includes(termino.toLowerCase())
    );
    
    if (productGrid) {
        productGrid.innerHTML = '';
        productosFiltrados.forEach(producto => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-image">
                    ${producto.icono}
                </div>
                <h3>${producto.nombre}</h3>
                <p class="product-price">$${producto.precio.toFixed(2)}</p>
                <button class="add-to-cart" onclick="agregarAlCarrito('${producto.id}')">
                    Agregar al Carrito
                </button>
            `;
            productGrid.appendChild(productCard);
        });
    }
}