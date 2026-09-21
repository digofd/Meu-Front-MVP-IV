import { useEffect, useRef } from 'react'

export function DialogoConfirmacao({ aberto, titulo, mensagem, rotuloConfirmar,
                                     aoConfirmar, aoCancelar }) {
  const botaoCancelar = useRef(null)

  // Foco no botão menos destrutivo, e Escape cancela.
  useEffect(() => {
    if (!aberto) return undefined
    botaoCancelar.current?.focus()
    const aoTeclar = (evento) => { if (evento.key === 'Escape') aoCancelar() }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aberto, aoCancelar])

  if (!aberto) return null

  return (
    <div className="fundo-modal" onClick={aoCancelar}>
      <div className="modal" role="alertdialog" aria-modal="true"
           aria-labelledby="titulo-confirmacao" aria-describedby="texto-confirmacao"
           onClick={(evento) => evento.stopPropagation()}>
        <h3 id="titulo-confirmacao">{titulo}</h3>
        <p id="texto-confirmacao">{mensagem}</p>
        <div className="modal-acoes">
          <button ref={botaoCancelar} className="secundario" onClick={aoCancelar}>
            Cancelar
          </button>
          <button className="perigo-solido" onClick={aoConfirmar}>
            {rotuloConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
