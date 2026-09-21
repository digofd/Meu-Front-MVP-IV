import { Fragment, useEffect, useState } from 'react'

import { api } from '../api.js'
import { SeloStatus, Vazio, Carregando } from './Basicos.jsx'
import { copiar } from '../clipboard.js'
import { fatiasDeRosca, barrasProporcionais } from '../core/grafico.js'
import {
  descreverStatus, formatarData, formatarTeto, formatarVisibilidade, proporcaoVfr,
} from '../core/status.js'

/* Gráfico de rosca da distribuição de status. A geometria vem do núcleo puro. */
function Rosca({ porStatus }) {
  const dados = Object.entries(porStatus).map(([chave, valor]) => ({
    chave, valor, cor: descreverStatus(chave).cor,
  }))
  const fatias = fatiasDeRosca(dados)
  const proporcao = proporcaoVfr(porStatus)

  if (fatias.length === 0) return null

  return (
    <div className="rosca">
      <svg width="120" height="120" viewBox="0 0 120 120" role="img"
           aria-label="Distribuição de condições observadas">
        {fatias.map((fatia) => (
          <path key={fatia.chave} d={fatia.d} fill={fatia.cor} opacity="0.9">
            <title>{`${descreverStatus(fatia.chave).rotulo}: ${fatia.valor} (${fatia.percentual.toFixed(0)}%)`}</title>
          </path>
        ))}
      </svg>
      <div className="rosca-centro">
        <div className="pct">{proporcao === null ? '—' : `${Math.round(proporcao * 100)}%`}</div>
        <div className="txt">VFR</div>
      </div>
    </div>
  )
}

/* Barras horizontais por status. */
function Barras({ porStatus }) {
  const dados = barrasProporcionais(
    Object.entries(porStatus).map(([chave, valor]) => ({
      chave, valor, cor: descreverStatus(chave).cor,
    })),
  )
  return (
    <div className="barras">
      {dados.map((item) => (
        <div className="barra-linha" key={item.chave}>
          <span>{descreverStatus(item.chave).rotulo}</span>
          <span className="barra-trilho">
            <span className="barra-preenchida"
                  style={{ width: `${item.largura}%`, background: item.cor }} />
          </span>
          <span className="mono" style={{ textAlign: 'right' }}>{item.valor}</span>
        </div>
      ))}
    </div>
  )
}

/* Botão que copia a mensagem original, com retorno no próprio rótulo. */
function BotaoCopiar({ texto }) {
  const [copiado, setCopiado] = useState(false)

  const aoClicar = async () => {
    const deuCerto = await copiar(texto)
    setCopiado(deuCerto)
    if (deuCerto) setTimeout(() => setCopiado(false), 1500)
  }

  return (
    <button type="button" className={`botao-copiar ${copiado ? 'copiado' : ''}`}
            onClick={aoClicar} aria-label="Copiar mensagem original">
      <span aria-hidden="true">⧉</span>
      {copiado ? 'Copiado' : 'Copiar'}
    </button>
  )
}

/* Linha com a mensagem METAR ou TAF sem tradução, do jeito que a REDEMET enviou (raw). */
function LinhaMensagemOriginal({ mensagem }) {
  return (
    <tr className="linha-raw">
      <td className="celula-raw-rotulo">
        <div className="rotulo-raw">MSG ORIGINAL</div>
        <BotaoCopiar texto={mensagem} />
      </td>
      <td colSpan={5} className="mono celula-raw">{mensagem}</td>
    </tr>
  )
}

/* Alternância entre visualização simplificada e completa. */
function ChaveVisualizacao({ completo, aoAlternar }) {
  return (
    <div className="chave-linha">
      <span className="meta">{completo ? 'Completa' : 'Simplificada'}</span>
      <button type="button" role="switch" aria-checked={completo}
              aria-label="Alternar visualização completa"
              className={`chave ${completo ? 'ligada' : ''}`}
              onClick={() => aoAlternar(!completo)}>
        <span className="chave-bolinha" />
      </button>
    </div>
  )
}

const JANELA_HORAS = 24
const ITENS_POR_PAGINA = 10
const PAGINA_VAZIA = { itens: [], total: 0, pagina: 1, tamanho: ITENS_POR_PAGINA, paginas: 0 }

function UltimasLeituras({ rota }) {
  const [completo, setCompleto] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [dados, setDados] = useState(PAGINA_VAZIA)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [rotaEmExibicao, setRotaEmExibicao] = useState(rota.id)
  if (rota.id !== rotaEmExibicao) {
    setRotaEmExibicao(rota.id)
    setPagina(1)
  }

  useEffect(() => {
    let cancelado = false
    setCarregando(true)
    api.observacoesDaRota(rota.id, { pagina, tamanho: ITENS_POR_PAGINA, horas: JANELA_HORAS })
      .then((resposta) => { if (!cancelado) { setDados(resposta); setErro('') } })
      .catch((e) => !cancelado && setErro(e.message))
      .finally(() => !cancelado && setCarregando(false))
    return () => { cancelado = true }
  }, [rota.id, pagina])

  return (
    <>
      <div className="cabecalho-secao">
        <h2>Leituras das últimas 24h</h2>
        <ChaveVisualizacao completo={completo} aoAlternar={setCompleto} />
      </div>

      {erro && <p className="meta" style={{ color: 'var(--vermelho)' }}>{erro}</p>}

      {carregando && dados.total === 0 && <Carregando texto="Buscando leituras" />}

      {!carregando && !erro && dados.total === 0 && (
        <Vazio icone="🌥️" titulo="Nenhuma leitura nas últimas 24h"
               detalhe="A coleta horária preencherá esta tabela na próxima execução." />
      )}

      {dados.total > 0 && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className={completo ? 'com-raw' : ''}>
              <thead>
                <tr>
                  <th>Recebido</th><th>ICAO</th><th>Tipo</th>
                  <th>Teto</th><th>Visibilidade</th><th>Condição</th>
                </tr>
              </thead>
              <tbody>
                {dados.itens.map((o) => (
                  <Fragment key={o.id}>
                    <tr>
                      <td className="mono">{formatarData(o.recebimento)}</td>
                      <td className="mono">{o.icao}</td>
                      <td>{o.tipo}</td>
                      <td>{formatarTeto(o.teto_ft)}</td>
                      <td>{formatarVisibilidade(o.visibilidade_m)}</td>
                      <td>
                        <SeloStatus status={o.status_operacional} titulo={o.base_legal} />
                        {o.aviso_temporario && (
                          <span className="aviso-temporario" title={o.aviso_temporario}
                                aria-label={o.aviso_temporario}>⚠</span>
                        )}
                      </td>
                    </tr>
                    {completo && <LinhaMensagemOriginal mensagem={o.mensagem_bruta} />}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="paginacao">
            <span className="meta">
              {dados.total} leitura(s) nas últimas 24h · página {dados.pagina} de {dados.paginas || 1}
            </span>
            <span className="acoes">
              <button className="secundario pequeno" disabled={dados.pagina <= 1}
                      onClick={() => setPagina((p) => p - 1)}>Anterior</button>
              <button className="secundario pequeno" disabled={dados.pagina >= dados.paginas}
                      onClick={() => setPagina((p) => p + 1)}>Próxima</button>
            </span>
          </div>
        </>
      )}
    </>
  )
}

/* Painel de detalhe: números, gráficos e leituras da rota selecionada. */
export function PainelDaRota({ rota, resumo, carregando }) {
  // O spinner só aparece quando não há nada para mostrar. Com uma rota em mãos,
  // o painel se atualiza no lugar em vez de sumir e voltar.
  if (carregando && !rota) {
    return <section className="painel"><Carregando texto="Carregando painel" /></section>
  }

  if (!rota) {
    return (
      <section className="painel">
        <Vazio icone="📊" titulo="Selecione uma rota"
               detalhe="O painel mostra a condição atual, a distribuição das observações e as últimas leituras." />
      </section>
    )
  }

  const porStatus = resumo?.por_status || {}
  const temDados = Object.keys(porStatus).length > 0

  return (
    <section className="painel">
      <h2>{rota.origem_icao} → {rota.destino_icao}</h2>

      <div className="numeros">
        <div className="numero">
          <div className="valor"><SeloStatus status={resumo?.status_atual} /></div>
          <div className="rotulo">Condição atual</div>
        </div>
        <div className="numero">
          <div className="valor">{resumo?.total ?? 0}</div>
          <div className="rotulo">Observações</div>
        </div>
        <div className="numero">
          <div className="valor">{resumo?.total_metar ?? 0}</div>
          <div className="rotulo">METAR</div>
        </div>
        <div className="numero">
          <div className="valor">{resumo?.total_taf ?? 0}</div>
          <div className="rotulo">TAF</div>
        </div>
        <div className="numero">
          <div className="valor" style={{ fontSize: 15 }}>{formatarData(resumo?.ultima_leitura)}</div>
          <div className="rotulo">Última leitura</div>
        </div>
      </div>

      {temDados ? (
        <div className="graficos">
          <Rosca porStatus={porStatus} />
          <Barras porStatus={porStatus} />
        </div>
      ) : (
        <Vazio icone="🌥️" titulo="Sem observações ainda"
               detalhe="A coleta horária preencherá este painel na próxima execução." />
      )}

      <UltimasLeituras rota={rota} />
      <p className="meta" style={{ marginTop: 12, marginBottom: 0 }}>
        A condição atual considera apenas METAR — TAF é previsão, e previsão não
        descreve a condição de agora.
      </p>
    </section>
  )
}
