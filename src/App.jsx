import { useCallback, useEffect, useRef, useState } from 'react'

import { api, URL_DA_API } from './api.js'
import { Toasts } from './components/Basicos.jsx'
import { DialogoConfirmacao } from './components/DialogoConfirmacao.jsx'
import { FormularioRota } from './components/FormularioRota.jsx'
import { ListaDeRotas } from './components/ListaDeRotas.jsx'
import { PainelDaRota } from './components/PainelDaRota.jsx'
import { PainelTendencia } from './components/PainelTendencia.jsx'

const CRITERIO_INICIAL = {
  pagina: 1, tamanho: 10, icao: '', ativa: '', ordenar_por: 'criado_em', ordem: 'desc',
}
const PAGINA_VAZIA = { itens: [], total: 0, pagina: 1, tamanho: 10, paginas: 0 }

/*
  Casca do front-end: concentra o IO (chamadas à API) e distribui dados prontos
  para os componentes, que só desenham. As decisões de apresentação ficam nas
  funções puras de `src/core/`.
 */
export default function App() {
  const [pagina, setPagina] = useState(PAGINA_VAZIA)
  const [criterio, setCriterio] = useState(CRITERIO_INICIAL)
  const [resumos, setResumos] = useState({})
  const [selecionada, setSelecionada] = useState(null)
  const [resumoAtual, setResumoAtual] = useState(null)
  const [carregandoLista, setCarregandoLista] = useState(true)
  const [carregandoPainel, setCarregandoPainel] = useState(false)
  const [criando, setCriando] = useState(false)
  const [rotaParaExcluir, setRotaParaExcluir] = useState(null)
  // Qual rota está selecionada agora, para descartar resposta que chegou tarde.
  const selecaoAtual = useRef(null)
  const [saude, setSaude] = useState('checando')
  const [avisos, setAvisos] = useState([])

  const avisar = useCallback((texto, tipo = 'sucesso') => {
    const id = Date.now() + Math.random()
    setAvisos((atuais) => [...atuais, { id, texto, tipo }])
    setTimeout(() => setAvisos((atuais) => atuais.filter((a) => a.id !== id)), 4200)
  }, [])

  /* GET /routes recarrega a lista e os resumos de cada rota da página. */
  const carregarLista = useCallback(async () => {
    setCarregandoLista(true)
    try {
      const resposta = await api.listarRotas(criterio)
      setPagina(resposta)
      const pares = await Promise.all(
        resposta.itens.map(async (rota) => [rota.id, await api.resumoDaRota(rota.id)]),
      )
      setResumos(Object.fromEntries(pares))
    } catch (erro) {
      avisar(erro.message, 'erro')
      setPagina(PAGINA_VAZIA)
    } finally {
      setCarregandoLista(false)
    }
  }, [criterio, avisar])

  useEffect(() => { carregarLista() }, [carregarLista])

  useEffect(() => {
    api.saude().then(() => setSaude('ok')).catch(() => setSaude('erro'))
  }, [])

 
  const selecionar = async (rota) => {
    const resumoEmCache = resumos[rota.id] ?? null
    setSelecionada(rota)
    setResumoAtual(resumoEmCache)
    setCarregandoPainel(!resumoEmCache)
    selecaoAtual.current = rota.id
    try {
      const [completa, resumo] = await Promise.all([
        api.buscarRota(rota.id), api.resumoDaRota(rota.id),
      ])

      if (selecaoAtual.current !== rota.id) return
      setSelecionada(completa)
      setResumoAtual(resumo)
    } catch (erro) {
      avisar(erro.message, 'erro')
    } finally {
      if (selecaoAtual.current === rota.id) setCarregandoPainel(false)
    }
  }

  /** POST /routes */
  const criar = async (dados) => {
    setCriando(true)
    try {
      const criada = await api.criarRota(dados)
      avisar(`Rota ${criada.origem_icao} → ${criada.destino_icao} criada com ` +
             `${criada.observations.length} observação(ões).`)
      await carregarLista()
      await selecionar(criada)
      return criada
    } catch (erro) {
      avisar(erro.message, 'erro')
      return null
    } finally {
      setCriando(false)
    }
  }

  /** PUT /routes/{id} */
  const alternar = async (rota) => {
    try {
      await api.alterarRota(rota.id, !rota.ativa)
      avisar(`Rota ${rota.origem_icao} → ${rota.destino_icao} ` +
             `${rota.ativa ? 'desativada' : 'ativada'}.`)
      await carregarLista()
      if (selecionada?.id === rota.id) await selecionar(rota)
    } catch (erro) {
      avisar(erro.message, 'erro')
    }
  }

 
  const pedirExclusao = (rota) => setRotaParaExcluir(rota)

  const confirmarExclusao = async () => {
    const rota = rotaParaExcluir
    setRotaParaExcluir(null)
    if (!rota) return
    try {
      await api.removerRota(rota.id)
      avisar(`Rota ${rota.origem_icao} → ${rota.destino_icao} excluída.`)
      if (selecionada?.id === rota.id) { setSelecionada(null); setResumoAtual(null) }
      await carregarLista()
    } catch (erro) {
      avisar(erro.message, 'erro')
    }
  }

  return (
    <div className="container">
      <header className="topo">
        <div className="marca">
          <span className="logo" aria-hidden="true">✈</span>
          <div>
            <h1>SkyRoute</h1>
            <p>Condições VFR por rota · METAR e TAF da REDEMET · ICA 100-12</p>
          </div>
        </div>
        <div className="saude">
          <span className={`ponto ${saude === 'ok' ? 'ok' : saude === 'erro' ? 'erro' : ''}`} />
          {saude === 'ok' ? 'API conectada' : saude === 'erro' ? 'API indisponível' : 'verificando'}
          <span className="mono">· {URL_DA_API}</span>
        </div>
      </header>

      <FormularioRota aoCriar={criar} ocupado={criando} />

      <div className="grade-detalhe">
        <ListaDeRotas pagina={pagina} carregando={carregandoLista} criterio={criterio}
                      resumos={resumos} selecionada={selecionada}
                      aoMudarCriterio={setCriterio} aoSelecionar={selecionar}
                      aoAlternar={alternar} aoRemover={pedirExclusao} />
        <PainelDaRota rota={selecionada} resumo={resumoAtual} carregando={carregandoPainel} />
      </div>

      {selecionada && <PainelTendencia rota={selecionada} />}

      <DialogoConfirmacao
        aberto={rotaParaExcluir !== null}
        titulo="Excluir rota?"
        mensagem={rotaParaExcluir
          ? `A rota ${rotaParaExcluir.origem_icao} → ${rotaParaExcluir.destino_icao} e as ` +
            `${rotaParaExcluir.total_observations} observações coletadas serão removidas. ` +
            'Esta ação não pode ser desfeita.'
          : ''}
        rotuloConfirmar="Excluir rota"
        aoConfirmar={confirmarExclusao}
        aoCancelar={() => setRotaParaExcluir(null)} />

      <Toasts avisos={avisos} />
    </div>
  )
}
