const mercadopago = require('mercadopago');

// Configurar Mercado Pago
mercadopago.configure({
  access_token: 'APP_USR-951845198622888-112005-c7b45ddf420cc393a33174a2333e6fde-3004658466'
});

exports.handler = async (event, context) => {
  // Habilitar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Manejar preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      const { items, total } = JSON.parse(event.body);

      const formattedItems = items.map(item => ({
        title: item.nombre || 'Producto MAC Style',
        quantity: Number(item.cantidad) || 1,
        currency_id: 'MXN',
        unit_price: Number(item.precio) || 0
      }));

      const preference = {
        items: formattedItems,
        back_urls: {
          success: "https://maquillajefire.web.app/success.html",
          failure: "https://maquillajefire.web.app/failure.html",
          pending: "https://maquillajefire.web.app/pending.html"
        },
        auto_return: "approved"
      };

      const result = await mercadopago.preferences.create(preference);

      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          id: result.body.id,
          init_point: result.body.init_point
        })
      };

    } catch (error) {
      return {
        statusCode: 500,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: error.message
        })
      };
    }
  }

  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: 'Not found' })
  };
};