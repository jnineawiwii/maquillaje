require('dotenv').config();
const express = require('express');
const mercadopago = require('mercadopago');
const cors = require('cors');

const app = express();

// Configurar CORS para permitir tu dominio de Firebase
app.use(cors({
    origin: [
        'http://localhost:8000',
        'http://localhost:5500', 
        'http://127.0.0.1:5500',
        'https://maquillajefire.web.app',  // Tu dominio de Firebase
        'https://maquillajefire.firebaseapp.com'
    ],
    credentials: true
}));

app.use(express.json());

// Configurar Mercado Pago
mercadopago.configure({
    access_token: process.env.MP_ACCESS_TOKEN || 'APP_USR-951845198622888-112005-c7b45ddf420cc393a33174a2333e6fde-3004658466'
});

// Endpoint para crear preferencia
app.post('/create-preference', async (req, res) => {
    try {
        console.log('📦 Recibiendo solicitud de pago...');
        console.log('Datos recibidos:', JSON.stringify(req.body, null, 2));
        
        const { items, total } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                error: 'El carrito está vacío o items no válidos' 
            });
        }

        // Formatear items para Mercado Pago
        const formattedItems = items.map(item => ({
            id: item.id || Math.random().toString(36).substr(2, 9),
            title: item.nombre || item.title || 'Producto MAC Style',
            description: item.categoria || item.description || 'Producto de belleza',
            quantity: Number(item.cantidad || item.quantity) || 1,
            currency_id: 'MXN',
            unit_price: Number(item.precio || item.price) || 0,
            picture_url: item.imagen || item.image || null
        }));

        console.log('🔄 Creando preferencia con items:', formattedItems);

        const preference = {
            items: formattedItems,
            back_urls: {
                success: "https://maquillajefire.web.app/success.html",
                failure: "https://maquillajefire.web.app/failure.html",
                pending: "https://maquillajefire.web.app/pending.html"
            },
            auto_return: "approved",
            payment_methods: {
                excluded_payment_methods: [{ id: "amex" }],
                excluded_payment_types: [{ id: "atm" }],
                installments: 12
            },
            statement_descriptor: "MACSTYLEMAKEUP",
            external_reference: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        const result = await mercadopago.preferences.create(preference);
        
        console.log('✅ Preferencia creada:', result.body.id);
        
        res.json({ 
            success: true,
            id: result.body.id,
            init_point: result.body.init_point,
            sandbox_init_point: result.body.sandbox_init_point
        });
        
    } catch (error) {
        console.error('❌ ERROR creando preferencia:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error creando preferencia de pago',
            details: error.message
        });
    }
});

// Endpoint para verificar estado de pago
app.get('/payment/:id', async (req, res) => {
    try {
        const paymentId = req.params.id;
        const payment = await mercadopago.payment.get(paymentId);
        
        res.json({
            status: payment.body.status,
            status_detail: payment.body.status_detail,
            payment_method: payment.body.payment_method_id,
            amount: payment.body.transaction_amount,
            date_created: payment.body.date_created
        });
    } catch (error) {
        console.error('Error obteniendo pago:', error);
        res.status(500).json({ error: 'Error obteniendo estado del pago' });
    }
});

// Health check mejorado
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        service: 'MAC Style Payments API',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Ruta de prueba
app.get('/test', (req, res) => {
    res.json({ 
        message: '🚀 Backend MAC Style funcionando correctamente',
        endpoints: {
            create_preference: 'POST /create-preference',
            health: 'GET /health',
            payment_status: 'GET /payment/:id'
        }
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`\n🎉 Backend MAC Style iniciado correctamente`);
    console.log(`📍 Puerto: ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📍 Health Check: http://localhost:${PORT}/health`);
    console.log(`📍 Test Endpoint: http://localhost:${PORT}/test`);
    console.log(`\n💳 Endpoints de Pago:`);
    console.log(`   POST http://localhost:${PORT}/create-preference`);
    console.log(`   GET  http://localhost:${PORT}/payment/:id`);
    console.log(`\n🌐 URLs permitidas CORS:`);
    console.log(`   - http://localhost:8000`);
    console.log(`   - https://maquillajefire.web.app`);
    console.log(`   - https://maquillajefire.firebaseapp.com`);
});