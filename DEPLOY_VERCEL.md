# Deploy na Vercel (frontend + backend)

O frontend na Vercel chama a **API do backend** para PIX e pagamentos. Por isso é preciso:

1. **Colocar o backend no ar** (em algum serviço)
2. **Dizer para o frontend qual é a URL do backend** (variável na Vercel)

---

## 1. Deploy do backend

O backend está na pasta `backend/` (Express + Mercado Pago). Você precisa hospedá-lo em um serviço que rode Node.js. Exemplos gratuitos:

### Opção A – Render (recomendado)

1. Acesse [render.com](https://render.com) e crie uma conta.
2. **New** → **Web Service**.
3. Conecte o **mesmo repositório** do GitHub (ou faça um repositório só para o backend).
4. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** adicione as variáveis do seu `backend/.env` (por exemplo `MP_ACCESS_TOKEN`, `MERCADO_PAGO_ACCESS_TOKEN`, etc.).
5. Deploy. Anote a URL do serviço, ex: `https://seu-backend.onrender.com`.

### Opção B – Railway

1. Acesse [railway.app](https://railway.app), conecte o GitHub.
2. **New Project** → **Deploy from GitHub** e escolha o repositório.
3. Defina a **root** do projeto como a pasta `backend` (ou suba só a pasta backend).
4. Adicione as variáveis de ambiente do backend.
5. Gere um domínio público e copie a URL (ex: `https://seu-app.railway.app`).

---

## 2. Configurar a URL do backend na Vercel

**Importante:** o nome da variável é com **underscore** (`_`), não com hífen (`-`).

| ❌ Errado        | ✅ Correto          |
|------------------|---------------------|
| `VITE-API-BASE-URL` | `VITE_API_BASE_URL` |

1. Abra o projeto do **frontend** na [Vercel](https://vercel.com) (socieda-alt-shopp).
2. Vá em **Settings** → **Environment Variables**.
3. Crie a variável:
   - **Name:** `VITE_API_BASE_URL` (exatamente assim, com **underscores**)
   - **Value:** a URL do Railway **sem barra no final** (ex: `https://socieda-alt-shopp-pr.up.railway.app`)
   - Marque **Production** (e Preview se quiser).
4. Salve.

---

## 3. Fazer um novo deploy do frontend

As variáveis `VITE_*` são embutidas no build. Depois de adicionar ou mudar `VITE_API_BASE_URL`:

1. Na Vercel: **Deployments** → no último deploy, **⋯** → **Redeploy**.
2. Ou dê um novo **push** no GitHub para disparar um deploy automático.

Depois disso, o site na Vercel vai usar a URL do backend que você configurou e o PIX deve parar de tentar acessar `localhost:3000`.

---

## Resumo

| Onde              | O que fazer |
|-------------------|------------|
| **Render/Railway** | Subir a pasta `backend`, configurar env do Mercado Pago, copiar a URL do serviço. |
| **Vercel**         | Adicionar `VITE_API_BASE_URL` = URL do backend e dar **Redeploy**. |

Se o backend ainda não estiver no ar, a mensagem na tela vai pedir para configurar `VITE_API_BASE_URL`; assim que a URL estiver correta e o deploy refeito, a conexão deve funcionar.
