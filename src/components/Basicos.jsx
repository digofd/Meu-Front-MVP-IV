/* Componentes de apresentação sem estado. */

import { descreverStatus } from '../core/status.js'

export function SeloStatus({ status, titulo }) {
  const { rotulo, cor, icone, descricao, condicoesOperacionais } = descreverStatus(status)
  const selo = (
    <span className="selo" style={{ color: cor }}
          title={condicoesOperacionais ? undefined : (titulo || descricao)}>
      <span aria-hidden="true">{icone}</span>
      {rotulo}
    </span>
  )
  if (!condicoesOperacionais) return selo
  return (
    <span className="selo-com-dica" tabIndex={0}>
      {selo}
      <span className="dica-operacional" role="tooltip">
        <strong>{descricao}</strong>
        <ul>
          {condicoesOperacionais.map((linha) => <li key={linha}>{linha}</li>)}
        </ul>
      </span>
    </span>
  )
}

/* Estado vazio com ícone e explicação do que fazer. */
export function Vazio({ icone = '🛬', titulo, detalhe }) {
  return (
    <div className="vazio">
      <span className="icone" aria-hidden="true">{icone}</span>
      <strong>{titulo}</strong>
      {detalhe && <p style={{ margin: '6px 0 0', fontSize: 13 }}>{detalhe}</p>}
    </div>
  )
}

/* Indicador de carregamento acessível. */
export function Carregando({ texto = 'Carregando' }) {
  return (
    <div className="vazio" role="status" aria-live="polite">
      <span className="carregando" aria-hidden="true" /> <span>{texto}…</span>
    </div>
  )
}

/* Pilha de avisos temporários no canto da tela. */
export function Toasts({ avisos }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {avisos.map((aviso) => (
        <div key={aviso.id} className={`toast ${aviso.tipo}`}>{aviso.texto}</div>
      ))}
    </div>
  )
}
