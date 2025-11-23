document.addEventListener('DOMContentLoaded', function () {

    // --- 1. LÓGICA PARA EL MENÚ DESPLEGABLE (HAMBURGUESA) ---
    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdownContent = document.querySelector('.dropdown-content');

    if (dropdownBtn && dropdownContent) {
        dropdownBtn.addEventListener('click', function (e) {
            // Evita que el clic en el botón se propague al documento y cierre el menú inmediatamente
            e.stopPropagation();
            // Alterna la clase 'show' para mostrar u ocultar el menú
            dropdownContent.classList.toggle('show');
        });

        // Cierra el menú si se hace clic en cualquier otro lugar de la página
        document.addEventListener('click', function (e) {
            if (!dropdownContent.contains(e.target) && !dropdownBtn.contains(e.target)) {
                dropdownContent.classList.remove('show');
            }
        });
    }

    // --- 2. LÓGICA PARA EL ICONO DE BÚSQUEDA MÓVIL ---
    const searchIconBtn = document.querySelector('.search-icon-btn');
    const mobileSearchContainer = document.querySelector('.mobile-search-container');
    const mobileSearchForm = mobileSearchContainer ? mobileSearchContainer.querySelector('.search-form') : null;
    const mobileSearchInput = document.getElementById('mobile-search-input');
    
    if (searchIconBtn && mobileSearchContainer && mobileSearchForm && mobileSearchInput) {
        // 1. Al hacer clic en la lupa, muestra/oculta el buscador
        searchIconBtn.addEventListener('click', function (e) {
            e.preventDefault(); // Previene la navegación si el enlace tiene un href="#"
            e.stopPropagation();
            
            // Alterna la clase 'show' para mostrar u ocultar el contenedor de búsqueda
            mobileSearchContainer.classList.toggle('show');
            
            // Si el menú desplegable está abierto, ciérralo
            if (dropdownContent && dropdownContent.classList.contains('show')) {
                dropdownContent.classList.remove('show');
            }
        });

        // 2. Al enviar el formulario de búsqueda móvil
        mobileSearchForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Evita que la página se recargue
            const searchTerm = mobileSearchInput.value.trim();

            if (searchTerm) {
                // Usamos el sistema de rutas existente para buscar
                window.location.hash = `products?search=${encodeURIComponent(searchTerm)}`;
            }

            // Oculta el contenedor de búsqueda después de la acción
            mobileSearchContainer.classList.remove('show');
        });
    }
});

/**
 * Verifica y muestra en consola el estilo 'display' del carrusel de productos.
 * Es útil para depurar si los estilos responsivos se están aplicando.
 */
function verificarEstiloCarrusel() {
    const productGrid = document.querySelector('.product-grid');
    if (!productGrid) {
        console.log('🟡 No se encontró el contenedor .product-grid en la página.');
        return;
    }

    // Usamos getComputedStyle para obtener el estilo que el navegador está aplicando AHORA MISMO.
    const estiloActual = window.getComputedStyle(productGrid);
    const displayProperty = estiloActual.getPropertyValue('display');

    console.log(`🔵 Estilo actual de '.product-grid' -> display: ${displayProperty}`);
}

// Ejecuta la verificación cuando la página carga y también cuando se redimensiona la ventana.
document.addEventListener('DOMContentLoaded', verificarEstiloCarrusel);
window.addEventListener('resize', verificarEstiloCarrusel);