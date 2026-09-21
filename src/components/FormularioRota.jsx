import { useState } from 'react'

const ICAO_VALIDO = /^[A-Za-z]{2}[A-Za-z0-9]{2}$/

export function FormularioRota({ aoCriar, ocupado }) {
  const [origem, setOrigem] = useState('')
  const [destino, setDestino] = useState('')
  const [erro, setErro] = useState('')

  const validar = () => {
    if (!ICAO_VALIDO.test(origem) || !ICAO_VALIDO.test(destino)) {
      return 'Informe dois códigos ICAO de 4 caracteres, como SBSP e SBGL.'
    }
    if (origem.toUpperCase() === destino.toUpperCase()) {
      return 'Origem e destino precisam ser aeródromos diferentes.'
    }
    return ''
  }

  const enviar = async (evento) => {
    evento.preventDefault()
    const problema = validar()
    setErro(problema)
    if (problema) return
    const criada = await aoCriar({
      origem_icao: origem.toUpperCase(),
      destino_icao: destino.toUpperCase(),
      ativa: true,
    })
    if (criada) {
      setOrigem('')
      setDestino('')
    }
  }

  return (
    <form className="painel barra-rota" onSubmit={enviar}>
      <h2>Nova rota</h2>

      <div className="linha-campos-rota">
        <div className="campo campo-icao">
          <label htmlFor="origem">Origem</label>
          <input id="origem" value={origem} maxLength={4} placeholder="SBSP"
                 onChange={(e) => setOrigem(e.target.value.toUpperCase())} />
        </div>
        <div className="campo campo-icao">
          <label htmlFor="destino">Destino</label>
          <input id="destino" value={destino} maxLength={4} placeholder="SBGL"
                 onChange={(e) => setDestino(e.target.value.toUpperCase())} />
        </div>
        <button type="submit" disabled={ocupado}>
          {ocupado ? 'Coletando METAR e TAF…' : 'Criar rota e coletar agora'}
        </button>
      </div>

      {erro && <p style={{ color: 'var(--vermelho)', fontSize: 13, margin: '8px 0 0' }}>{erro}</p>}

      <p className="meta" style={{ margin: '10px 0 0' }}>
        A criação já dispara a primeira coleta na REDEMET, então pode levar alguns segundos.
      </p>
    </form>
  )
}
