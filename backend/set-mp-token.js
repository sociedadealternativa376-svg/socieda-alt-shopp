const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const envPath = path.join(__dirname, '.env')

console.log('Este script grava seu token Mercado Pago em backend/.env (não envie o token no chat).')
rl.question('Cole aqui seu MERCADO_PAGO_ACCESS_TOKEN e aperte Enter: ', (token) => {
  if (!token || token.trim().length === 0) {
    console.error('Token vazio. Abortando.')
    rl.close()
    process.exit(1)
  }

  const content = `MERCADO_PAGO_ACCESS_TOKEN=${token.trim()}\nMP_ACCESS_TOKEN=${token.trim()}\n`;

  try {
    fs.writeFileSync(envPath, content, { encoding: 'utf8', flag: 'w' })
    console.log(`Arquivo atualizado: ${envPath}`)
    console.log('Não compartilhe este arquivo. Não o comite no git.')
  } catch (err) {
    console.error('Erro ao gravar .env:', err.message)
    process.exit(1)
  }

  rl.close()
})
