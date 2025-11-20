// Contenido específico para la página de inicio
updatePageTitle('Inicio');

const homeContent = `
<section class="hero">
    <div class="hero-content">
        <h1>Belleza profesional a tu alcance</h1>
        <p>Descubre los productos que realzan tu belleza natural</p>
        <a href="products.html" class="btn-primary">Ver productos</a>
    </div>
</section>

<section class="featured-products">
    <h2>Productos destacados</h2>
    <div id="featured-products-grid" class="products-grid">
        <!-- Los productos se cargarán con JavaScript -->
    </div>
</section>

<!-- Video destacado -->
<div id="featured-video-section" style="margin-top: 40px; display: none;">
    <div style="max-width: 1000px; margin-left: auto; margin-right: auto;">
        <h2 id="featured-video-title" style="text-align:center; font-size:2rem; font-weight:700; margin-bottom:20px; color:#111;"></h2>
        <p id="featured-video-description" style="text-align:center; margin-bottom:25px; color:#555; font-size:1.1rem;"></p>
        <div class="video-container">
            <video id="promoVideo" controls autoplay muted style="display: none;">
                Tu navegador no soporta el elemento de video.
            </video>
            <iframe id="embeddedVideo" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="display: none;"></iframe>
        </div>
        <div id="video-category" style="text-align:center; margin-top:15px;"></div>
    </div>
</div>

<!-- Más videos -->
<section id="other-videos-section" class="videos-section" style="margin-top: 60px; padding: 20px; display: none;">
    <h2 style="text-align:center; font-size:2rem; font-weight:700; margin-bottom:30px; color:#111;">CONOCENOS!!</h2>
    <div id="other-videos-grid" class="videos-grid"></div>
</section>
`;

displayContent(homeContent);

// Aquí va todo el JavaScript específico de la página de inicio
// (cargar productos destacados, videos, etc.)