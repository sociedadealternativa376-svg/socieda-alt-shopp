# ⚡ GUIA DE INÍCIO RÁPIDO - Mercado Pago

## 🎯 Em 5 Minutos Você Terá Pagamentos Funcionando!

### PASSO 1: Obter Token (2 min)
```bash
1. Abra: https://www.mercadopago.com.br/developers
2. Faça login ou crie uma conta
3. Vá em: Credenciais
4. Copie o "Access Token" (deve começar com TEST-)
```

### PASSO 2: Configurar Backend (2 min)
```bash
# Abra backend/.env
MERCADO_PAGO_ACCESS_TOKEN=COLE_SEU_TOKEN_AQUI
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
PORT=3000
```

### PASSO 3: Iniciar Tudo (1 min)

**Terminal 1 (Backend):**
```bash
cd backend
npm install
node index.js
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

**Pronto! 🎉 Acesse:** http://localhost:5173

---

## 🧪 Teste Agora

### Ir para Checkout
1. Clique em "Finalizar Compra"
2. Preencha dados de entrega
3. Escolha método de pagamento

### Testar Cartão
- Número: `4111 1111 1111 1111`
- Titular: `APRO`
- Validade: `12/25`
- CVV: `123`

### Testar Pix
- Clique em "Gerar Código Pix"
- Escaneie com seu banco
- Pronto! ✅

---

## 📁 Arquivos Importantes

| Arquivo | O que Faz |
|---------|-----------|
| `backend/index.js` | Endpoints de pagamento |
| `src/pages/Checkout.tsx` | Formulário de checkout |
| `MERCADO_PAGO_GUIDE.md` | Documentação completa |
| `backend/.env` | Suas credenciais |

---

## ⚠️ Erros Comuns

### "Invalid token"
- Verifique se começou com `TEST-`
- Copie novamente sem espaços

### "Connection refused"
- Backend está rodando? `node index.js`
- Porta 3000 está em uso?

### "Pix não gera QR Code"
- Use valor > R$ 1,00
- Verifique logs do backend

---

## 📞 Precisa de Ajuda?

1. **Leia:** `MERCADO_PAGO_GUIDE.md` (seção Troubleshooting)
2. **Execute:** `bash CHECKLIST_MERCADO_PAGO.sh`
3. **Verifique:** Logs do backend

---

**Está tudo pronto? Vamos ao código! 🚀**

→ Leia: `MERCADO_PAGO_GUIDE.md` para detalhes
→ Veja: `SUMARIO_EXECUTIVO.md` para visão geral
