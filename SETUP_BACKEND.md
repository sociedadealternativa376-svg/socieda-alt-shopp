# 🔧 Configuração do Backend para PIX

## ⚠️ IMPORTANTE: Erro de Conexão

Se você está vendo o erro `ERR_CONNECTION_REFUSED` ao tentar gerar o código PIX, significa que o backend não está rodando.

## 📋 Passos para Resolver

### 1. Iniciar o Backend

Abra um terminal e navegue até a pasta do backend:

```bash
cd backend
npm install  # Se ainda não instalou as dependências
npm start    # ou node server.js
```

O backend deve estar rodando em `http://localhost:3000`

### 2. Verificar se o Backend Está Funcionando

Abra no navegador ou use curl:

```bash
curl http://localhost:3000/health
```

Deve retornar:
```json
{
  "status": "OK",
  "backend": "online",
  "timestamp": "...",
  "mp": "configured"
}
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na pasta `backend/` com:

```env
MERCADO_PAGO_ACCESS_TOKEN=TEST-seu-token-aqui
MP_PUBLIC_KEY=TEST-sua-public-key-aqui
FRONTEND_URL=http://localhost:5173
PORT=3000
NODE_ENV=development
```

### 4. Obter Credenciais do Mercado Pago

1. Acesse https://www.mercadopago.com.br/developers/panel
2. Faça login
3. Vá até **Credenciais**
4. Copie o **Access Token** (ambiente TEST para desenvolvimento)
5. Copie a **Public Key**

### 5. Testar o PIX

Após iniciar o backend, tente gerar um código PIX novamente no checkout.

## 🐛 Troubleshooting

- **Erro: Connection Refused**: Backend não está rodando → Inicie o backend
- **Erro: Invalid Token**: Token do Mercado Pago inválido → Verifique o `.env`
- **Erro: CORS**: Backend não está permitindo requisições do frontend → Verifique CORS no `server.js`
