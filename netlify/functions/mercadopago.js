const functions = require('firebase-functions');
const mercadopago = require('mercadopago');

// Configurar Mercado Pago con tu Access Token REAL
mercadopago.configure({
  access_token: 'APP_USR-951845198622888-112005-c7b45ddf420cc393a33174a2333e6fde-3004658466'
});

exports.createPreference = functions.https.onRequest(async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method === 'POST') {
    try {
      const { items, total } = req.body;

      console.log('Recibiendo items:', items);

      // Crear preferencia REAL de Mercado Pago
      const preference = {
        items: items.map(item => ({
          id: item.id || Math.random().toString(36).substr(2, 9),
          title: item.nombre || 'Producto MAC Style',
          description: item.categoria || 'Producto de belleza',
          quantity: Number(item.cantidad) || 1,
          currency_id: 'MXN',
          unit_price: Number(item.precio) || 0,
          picture_url: item.imageUrl || null
        })),
        back_urls: {
          success: "https://fir-maquillaje.web.app/success.html",
          failure: "https://fir-maquillaje.web.app/failure.html",
          pending: "https://fir-maquillaje.web.app/pending.html"
        },
        auto_return: "approved",
        payment_methods: {
          excluded_payment_methods: [{ id: "amex" }],
          installments: 6
        },
        notification_url: "https://your-webhook-url.com/notifications"
      };

      console.log('Creando preferencia en Mercado Pago...');

      // Crear preferencia REAL en Mercado Pago
      const result = await mercadopago.preferences.create(preference);

      console.log('Preferencia creada:', result.body.id);

      res.json({
        success: true,
        id: result.body.id,
        init_point: result.body.init_point,
        sandbox_init_point: result.body.sandbox_init_point
      });

    } catch (error) {
      console.error('Error creando preferencia:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  } else {
    res.status(405).send('Method Not Allowed');
  }
});