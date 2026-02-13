@echo off
echo 🚀 Iniciando backend do Mercado Pago...
echo.

cd backend

if not exist server.js (
    echo ❌ Erro: Arquivo server.js não encontrado em backend/
    echo    Verifique se você está na raiz do projeto.
    pause
    exit /b 1
)

if not exist .env (
    echo ⚠️  Aviso: Arquivo .env não encontrado em backend/
    echo    O servidor pode não funcionar sem as credenciais do Mercado Pago.
    echo    Crie um arquivo backend/.env com:
    echo    MERCADO_PAGO_ACCESS_TOKEN=TEST-seu-token-aqui
    echo    MP_PUBLIC_KEY=TEST-sua-public-key-aqui
    echo.
)

echo 📦 Iniciando servidor na porta 3000...
echo 💡 Pressione Ctrl+C para parar o servidor
echo.

node server.js

pause
