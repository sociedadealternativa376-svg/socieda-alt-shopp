# 🚀 Mercado Pago - Checkout Transparente

## ✅ Status Atual

- **Backend**: ✅ Operacional (porta 3000)
  - `/health` - Health check
  - `/api/create-preference` - Checkout Pro (Mercado Pago)
  - `/api/create-payment` - Checkout Transparente (Cartão de Crédito)
  - `/api/create-pix` - Pagamento via Pix
  - `/api/payment/:id` - Status do pagamento

- **Frontend**: ✅ Pronto para integração (porta 8080)
  - Checkout UI completo
  - Integração com Mercado Pago SDK
  - Seleção de métodos de pagamento

## 🏃 Como Rodar

### Opção 1: 2 Terminais Simultâneos (Recomendado)

**Terminal 1 - Backend:**
```powershell
cd C:\Users\Cauan\socieda-alt-shop\backend
npm start
```

Verá logs como:
```
============================================================
🔥 Backend Mercado Pago - Checkout Transparente
🚀 Rodando na porta: 3000
📝 Ambiente: development
🌐 URL: http://localhost:3000
💰 MP Token: ✅ Configurado
============================================================
```

**Terminal 2 - Frontend:**
```powershell
cd C:\Users\Cauan\socieda-alt-shop\socieda-alt-shop
npm run dev
```

Verá:
```
VITE v5.4.19  ready in XXXX ms

➜  Local:   http://localhost:8080/
```

### Opção 2: Teste Rápido

Com backend rodando:
```powershell
cd C:\Users\Cauan\socieda-alt-shop
node test-backend.js
```

Resposta esperada:
```
✅ Status: 200
✅ Response:
{"status":"OK","backend":"online","timestamp":"...","mp":"configured"}
```

## 📋 Testando Checkout Transparente

### 1. Cartão de Crédito
- Acesse http://localhost:8080
- Navegue até Checkout
- Selecione "Cartão de Crédito"
- Use cartão teste: `4509 9535 6623 3704`
- Data: `12/25`
- CVV: `123`
- CPF: `12345678900`

### 2. Pix
- Selecione "Pix" no checkout
- Escaneie QR code ou copie chave

### 3. Logs do Backend
Terminal backend mostrará:
```
[POST /api/create-payment] Request recebida
[POST /api/create-payment] Body: {...}
[POST /api/create-payment] Enviando para Mercado Pago: {...}
[POST /api/create-payment] ✅ Pagamento criado: 123456789
```

## 🔧 Configuração

### .env (Raiz)
```
VITE_MP_PUBLIC_KEY=TEST-1caa955b-34ff-4f63-8559-1412fd802501
VITE_API_URL=http://localhost:3000
MP_ACCESS_TOKEN=TEST-684042988784191-012811-ce36d2354f57dcfa18d6e33310fa7c6d-3054002099
MERCADO_PAGO_ACCESS_TOKEN=TEST-684042988784191-012811-ce36d2354f57dcfa18d6e33310fa7c6d-3054002099
```

### backend/.env
```
MERCADO_PAGO_ACCESS_TOKEN=TEST-684042988784191-012811-ce36d2354f57dcfa18d6e33310fa7c6d-3054002099
MP_ACCESS_TOKEN=TEST-684042988784191-012811-ce36d2354f57dcfa18d6e33310fa7c6d-3054002099
NODE_ENV=development
PORT=3000
```

## 🐛 Troubleshooting

### "Connection refused"
- Verifique que backend está rodando em Terminal 1
- Verifique porta 3000 não está bloqueada por firewall
- Tente: `netstat -ano | findstr ":3000"`

### "CORS error"
- Backend está com CORS habilitado para origem `*`
- Verifique `VITE_API_URL` está correto

### Logs vazios no backend
- Certifique que criou 2 terminais diferentes
- Não feche Terminal 1 enquanto testa

## 📊 Fluxo de Pagamento

### Checkout Transparente (Cartão)
```
Frontend (React)
    ↓ (card data)
Mercado Pago SDK (tokeniza cartão)
    ↓ (token)
Backend (Express)
    ↓ (token + amount)
Mercado Pago API (/v1/payments)
    ↓ (payment confirmation)
Frontend (mostra sucesso/erro)
```

### Checkout Pro (Mercado Pago)
```
Frontend
    ↓ (items array)
Backend
    ↓ (create preference)
Mercado Pago API (/v1/preferences)
    ↓ (init_point URL)
Browser (redireciona para MP)
```

## 🎯 Próximos Passos

1. ✅ Backend respondendo
2. ✅ Frontend carregando
3. 🟡 Testar `/health` endpoint
4. 🟡 Testar fluxo completo de pagamento
5. 🟡 Webhooks (opcional)

---

**Última atualização**: 2026-02-04  
**Backend**: server.js  
**Frontend**: React + TypeScript + Vite  
**Mercado Pago SDK**: v2.12.0 (backend) + v1 (frontend)
