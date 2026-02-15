import { useState } from "react"

export default function PixCheckout() {

  const [qrCode, setQrCode] = useState("")
  const [qrImage, setQrImage] = useState("")
  const [loading, setLoading] = useState(false)

  const gerarPix = async () => {

    setLoading(true)

    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${API_BASE}/pix`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        valor: 19.9,
        email: "cliente@email.com"
      })
    })

    const data = await response.json()

    const pixData = data.point_of_interaction.transaction_data

    setQrCode(pixData.qr_code)
    setQrImage(pixData.qr_code_base64)

    setLoading(false)
  }

  return (
    <div style={{ padding: 20 }}>

      <button onClick={gerarPix}>
        {loading ? "Gerando Pix..." : "Pagar com Pix"}
      </button>

      {qrImage && (
        <div style={{ marginTop: 20 }}>
          <img
            src={`data:image/png;base64,${qrImage}`}
            width={250}
          />

          <p>Pix copia e cola:</p>

          <textarea
            value={qrCode}
            readOnly
            style={{ width: "100%", height: 120 }}
          />
        </div>
      )}

    </div>
  )
}
