# 🚀 Como Iniciar o Backend

## Método 1: Usando o Script (Recomendado)

### Windows:
```bash
start-backend.bat
```

### Linux/Mac:
```bash
node start-backend.js
```

## Método 2: Manual

1. Abra um terminal
2. Navegue até a pasta do backend:
   ```bash
   cd backend
   ```

3. Instale as dependências (se ainda não instalou):
   ```bash
   npm install
   ```

4. Inicie o servidor:
   ```bash
   npm start
   ```
   ou
   ```bash
   node server.js
   ```

## ✅ Verificar se Está Funcionando

Após iniciar, você deve ver:
```
🔥 Backend Mercado Pago - Checkout Transparente
🚀 Rodando na porta: 3000
🌐 URL: http://localhost:3000
💰 MP Token: ✅ Configurado
```

Teste no navegador: http://localhost:3000/health

## ⚙️ Configuração Necessária

Antes de iniciar, certifique-se de ter um arquivo `backend/.env` com:

```env
MERCADO_PAGO_ACCESS_TOKEN=TEST-seu-token-aqui
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## 🐛 Problemas Comuns

### Porta 3000 já em uso:
- Feche outros processos usando a porta 3000
- Ou mude a porta no `.env`: `PORT=3001`

### Token não configurado:
- Crie o arquivo `backend/.env` baseado em `backend/.env.example`
- Obtenha seu token em: https://www.mercadopago.com.br/developers/panel

### Dependências não instaladas:
```bash
cd backend
npm install
```
