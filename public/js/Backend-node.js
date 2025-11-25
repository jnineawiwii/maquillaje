const express = require('express');
const mercadopago = require('mercadopago');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: ['http://localhost:8000', 'http://localhost:5500'],
    credentials: true
}));

app.use(express.json());

// Configurar Mercado Pago
mercadopago.configure({
    access_token: 'APP_USR-951845198622888-112005-c7b45ddf420cc393a33174a2333e6fde-3004658466'
});

// Endpoint CORREGIDO - SIN auto_return problemático
app.post('/create-preference', async (req, res) => {
    try {
        console.log('📦 Recibiendo solicitud de pago...');
        
        const { items, total } = req.body;

        // Formatear items en MXN
        const formattedItems = items.map(item => ({
            title: item.nombre || 'Producto',
            description: item.categoria || 'Producto MAC Style',
            quantity: Number(item.cantidad) || 1,
            currency_id: 'MXN',
            unit_price: Number(item.precio) || 0
        }));

        console.log('Items formateados en MXN:', formattedItems);

        // PREFERENCE CORREGIDA - SIN auto_return
        const preference = {
            items: formattedItems,
            back_urls: {
                success: "http://localhost:8000/success.html",
                failure: "http://localhost:8000/failure.html", 
                pending: "http://localhost:8000/pending.html"
            }
            // auto_return REMOVIDO completamente
        };

        console.log('🔄 Creando preferencia en MXN...');
        const result = await mercadopago.preferences.create(preference);
        
        console.log('✅ Preferencia creada exitosamente en MXN');
        console.log('ID:', result.body.id);
        console.log('Init Point:', result.body.init_point);
        
        res.json({ 
            id: result.body.id,
            init_point: result.body.init_point,
            sandbox_init_point: result.body.sandbox_init_point
        });
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.error('Detalles completos:', error);
        
        res.status(500).json({ 
            error: 'Error creando preferencia de pago',
            details: error.message
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Servidor de pagos funcionando en MXN',
        currency: 'MXN',
        timestamp: new Date().toISOString()
    });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚀 Servidor de pagos en puerto ${PORT}`);
    console.log('📍 Moneda: MXN (Pesos Mexicanos)');
    console.log('📍 Health: http://localhost:3001/health');
    console.log('📍 Listo para recibir pagos');
    console.log('');
    console.log('💡 Para probar pagos:');
    console.log('   Tarjeta: 5031 7557 3453 0604');
    console.log('   CVV: 123');
    console.log('   Fecha: Cualquier fecha futura');
});