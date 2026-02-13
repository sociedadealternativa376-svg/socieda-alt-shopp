// backend/routes/payment.js
// Este é um exemplo de como processar pagamentos com Mercado Pago
// Você precisará instalar: npm install mercadopago

import express from 'express';
import MercadoPago from 'mercadopago';

const router = express.Router();

// Configurar credenciais do Mercado Pago
MercadoPago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN',
});

router.post('/create-payment', async (req, res) => {
  try {
    const { token, items, payer } = req.body;

    // Calcular valor total
    const total = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

    // Criar preferência de pagamento
    const preference = {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: 'BRL',
      })),
      payer: {
        email: payer.email,
        first_name: payer.first_name,
        phone: {
          number: payer.phone,
        },
      },
      back_urls: {
        success: process.env.FRONTEND_URL + '/pedido-confirmado',
        pending: process.env.FRONTEND_URL + '/pedido-pendente',
        failure: process.env.FRONTEND_URL + '/pagamento-falhou',
      },
      auto_return: 'approved',
      external_reference: `order-${Date.now()}`,
    };

    const response = await MercadoPago.preferences.create(preference);

    res.json({
      success: true,
      orderId: response.body.id,
      url: response.body.init_point,
    });
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
});

// Criar preferência (Checkout Pro) - suporta cartão/pix via checkout hospedado
router.post('/create-preference', async (req, res) => {
  try {
    const { items, payer } = req.body;

    const preference = {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: 'BRL',
      })),
      payer: {
        email: payer.email,
        first_name: payer.first_name,
        phone: {
          number: payer.phone,
        },
      },
      payment_methods: {
        excluded_payment_types: [],
        installments: 12,
      },
      back_urls: {
        success: process.env.FRONTEND_URL + '/pedido-confirmado',
        pending: process.env.FRONTEND_URL + '/pedido-pendente',
        failure: process.env.FRONTEND_URL + '/pagamento-falhou',
      },
      auto_return: 'approved',
      external_reference: `order-${Date.now()}`,
    };

    const response = await MercadoPago.preferences.create(preference);

    res.json({
      success: true,
      preferenceId: response.body.id,
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point,
    });
  } catch (error) {
    console.error('Erro ao criar preferência:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Criar pagamento Pix e retornar QR Code + payload (copia e cola)
router.post('/create-pix', async (req, res) => {
  try {
    const { items, payer } = req.body;
    const total = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

    const payment = {
      transaction_amount: Number(total.toFixed(2)),
      description: `Compra - ${items.length} itens`,
      payment_method_id: 'pix',
      payer: {
        email: payer.email,
        first_name: payer.first_name,
        phone: {
          number: payer.phone,
        },
      },
    };

    const response = await MercadoPago.payment.save(payment);

    // Alguns ambientes retornam a estrutura em response.body, outros em response;
    const body = response.body || response;

    const point = body.point_of_interaction || (body.transaction_details && body.transaction_details.external_resource_url ? { transaction_data: { qr_code: '', qr_code_base64: '', qr_code_text: body.transaction_details.external_resource_url } } : null);

    res.json({
      success: true,
      payment: body,
      qr_code: point?.transaction_data?.qr_code || null,
      qr_code_base64: point?.transaction_data?.qr_code_base64 || null,
      qr_copy_text: point?.transaction_data?.qr_code_text || null,
    });
  } catch (error) {
    console.error('Erro ao criar pagamento Pix:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Consultar opções de parcelas (installments) via API do Mercado Pago
router.get('/installments', async (req, res) => {
  try {
    const { bin, amount } = req.query;
    if (!bin || !amount) return res.status(400).json({ success: false, message: 'bin e amount são obrigatórios' });

    const fetch = await import('node-fetch');
    const url = `https://api.mercadopago.com/v1/payment_methods/installments?bin=${encodeURIComponent(
      String(bin)
    )}&amount=${encodeURIComponent(String(amount))}`;

    const resp = await fetch.default(url, {
      headers: {
        Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await resp.json();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao buscar parcelas:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
