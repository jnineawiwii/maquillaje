// Datos de productos
const productos = [
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
    },
    {
        id: 4,
        nombre: "Rímel Volumizador",
        precio: 18.99,
        categoria: "ojos",
        icono: "👁️"
    },
    {
        id: 5,
        nombre: "Rubor en Polvo",
        precio: 22.50,
        categoria: "rostro",
        icono: "🌸"
    },
    {
        id: 6,
        nombre: "Delineador Líquido",
        precio: 15.25,
        categoria: "ojos",
        icono: "✏️"
    }
];

// Carrito
let carrito = [];
let total = 0;

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
    cargarProductos();
    actualizarCarrito();
    
    // Event listeners
    document.querySelector('.cart-icon a').addEventListener('click', (e) => {
        e.preventDefault();
        abrirCarrito();
    });
    
    closeModal.addEventListener('click', cerrarCarrito);
    checkoutBtn.addEventListener('click', finalizarCompra);
    
    // Cerrar modal al hacer click fuera
    window.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            cerrarCarrito();
        }
    });
});

// Cargar productos en la grid
function cargarProductos() {
    productGrid.innerHTML = '';
    
    productos.forEach(producto => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image">
                ${producto.icono}
            </div>
            <h3>${producto.nombre}</h3>
            <p class="product-price">$${producto.precio.toFixed(2)}</p>
            <button class="add-to-cart" onclick="agregarAlCarrito(${producto.id})">
                Agregar al Carrito
            </button>
        `;
        productGrid.appendChild(productCard);
    });
}

// Funciones del carrito
function agregarAlCarrito(id) {
    const producto = productos.find(p => p.id === id);
    const itemExistente = carrito.find(item => item.id === id);
    
    if (itemExistente) {
        itemExistente.cantidad++;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
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
    cartCount.textContent = totalItems;
    
    // Actualizar items del carrito
    cartItems.innerHTML = '';
    total = 0;
    
    if (carrito.length === 0) {
        cartItems.innerHTML = '<p>Tu carrito está vacío</p>';
        totalPrice.textContent = '0';
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
                <button onclick="eliminarDelCarrito(${item.id})" style="margin-left: 10px; color: red; border: none; background: none; cursor: pointer;">
                    🗑️
                </button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
    
    totalPrice.textContent = total.toFixed(2);
}

function abrirCarrito() {
    cartModal.style.display = 'block';
}

function cerrarCarrito() {
    cartModal.style.display = 'none';
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
    `;
    notification.textContent = mensaje;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Agregar animación CSS para la notificación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);