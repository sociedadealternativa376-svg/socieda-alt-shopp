require('dotenv').config()

const http = require('http');

const data = JSON.stringify({
  items: [
    { id: 'test-1', title: 'Teste', quantity: 1, unit_price: 1.0 }
  ],
  payer: {
    email: 'teste@teste.com',
    name: 'Teste Cliente',
    phone: '11999999999'
  }
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/create-preference',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', JSON.stringify(JSON.parse(body), null, 2));
  });
});

req.on('error', (err) => {
  console.error('Erro:', err.message);
});

req.write(data);
req.end();
