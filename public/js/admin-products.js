// Verificar autenticación y rol
firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.html?next=admin-products.html';
        return;
    }

    // Verificar rol del usuario
    const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
    if (!userDoc.exists) {
        alert('Usuario no encontrado');
        window.location.href = 'index.html';
        return;
    }

    const userData = userDoc.data();
    const userRole = userData.role || 'customer';

    // Solo permitir acceso a admin y admin_master
    if (userRole !== 'admin' && userRole !== 'admin_master') {
        alert('No tienes permisos para acceder a esta página');
        window.location.href = 'index.html';
        return;
    }

    // Cargar contenido del admin
    cargarProductosAdmin();
});

// Resto del código del admin de productos (las funciones que ya te pasé)
let productos = [];

async function cargarProductosAdmin() {
    try {
        const db = firebase.firestore();
        const querySnapshot = await db.collection('products').get();
        productos = [];
        
        querySnapshot.forEach(doc => {
            productos.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        mostrarProductosAdmin();
        
    } catch (error) {
        console.error("Error cargando productos:", error);
        document.getElementById('admin-content').innerHTML = '<div class="error">Error al cargar productos</div>';
    }
}

function mostrarProductosAdmin() {
    const content = document.getElementById('admin-content');
    
    if (productos.length === 0) {
        content.innerHTML = '<div class="loading">No hay productos</div>';
        return;
    }
    
    content.innerHTML = `
        <div class="filters">
            <input type="text" id="searchAdmin" placeholder="Buscar productos..." oninput="filtrarProductosAdmin()">
            <select id="categoryFilter" onchange="filtrarProductosAdmin()">
                <option value="all">Todas las categorías</option>
                <option value="labios">Labios</option>
                <option value="ojos">Ojos</option>
                <option value="rostro">Rostro</option>
            </select>
        </div>
        <div id="admin-products-grid" class="products-grid"></div>
    `;
    
    const grid = document.getElementById('admin-products-grid');
    grid.innerHTML = '';
    
    productos.forEach(producto => {
        const card = document.createElement('div');
        card.className = 'product-card-admin';
        card.innerHTML = `
            <div class="product-image" style="width: 100px; height: 100px; background: #f5f5f5; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; font-size: 2rem;">
                ${obtenerIcono(producto.category)}
            </div>
            <h3>${producto.name}</h3>
            <p><strong>Categoría:</strong> ${producto.category}</p>
            <p><strong>Precio:</strong> $${producto.price}</p>
            <p><strong>Descripción:</strong> ${producto.description || 'Sin descripción'}</p>
            <div class="product-actions">
                <button class="btn-admin btn-primary" onclick="editarProducto('${producto.id}')">✏️ Editar</button>
                <button class="btn-admin btn-danger" onclick="eliminarProducto('${producto.id}')">🗑️ Eliminar</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function obtenerIcono(categoria) {
    const iconos = {
        'labios': '💄',
        'ojos': '👁️', 
        'rostro': '✨'
    };
    return iconos[categoria] || '🎁';
}

function filtrarProductosAdmin() {
    const searchTerm = document.getElementById('searchAdmin').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    let productosFiltrados = productos;
    
    if (searchTerm) {
        productosFiltrados = productosFiltrados.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            (p.description && p.description.toLowerCase().includes(searchTerm))
        );
    }
    
    if (categoryFilter !== 'all') {
        productosFiltrados = productosFiltrados.filter(p => p.category === categoryFilter);
    }
    
    const grid = document.getElementById('admin-products-grid');
    grid.innerHTML = '';
    
    productosFiltrados.forEach(producto => {
        const card = document.createElement('div');
        card.className = 'product-card-admin';
        card.innerHTML = `
            <div class="product-image" style="width: 100px; height: 100px; background: #f5f5f5; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; font-size: 2rem;">
                ${obtenerIcono(producto.category)}
            </div>
            <h3>${producto.name}</h3>
            <p><strong>Categoría:</strong> ${producto.category}</p>
            <p><strong>Precio:</strong> $${producto.price}</p>
            <div class="product-actions">
                <button class="btn-admin btn-primary" onclick="editarProducto('${producto.id}')">✏️ Editar</button>
                <button class="btn-admin btn-danger" onclick="eliminarProducto('${producto.id}')">🗑️ Eliminar</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function cerrarSesion() {
    firebase.auth().signOut().then(() => {
        window.location.href = 'index.html';
    });
}

// Funciones CRUD básicas (las puedes implementar después)
function abrirModalAgregar() {
    alert('Funcionalidad de agregar producto - Por implementar');
}

function editarProducto(id) {
    alert(`Editar producto ${id} - Por implementar`);
}

function eliminarProducto(id) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
        alert(`Eliminar producto ${id} - Por implementar`);
    }
}