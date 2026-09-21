import { useEffect, useState } from 'react'

import { api } from '../api.js'
import { Carregando, Vazio } from './Basicos.jsx'
import { descreverStatus } from '../core/status.js'
import {
  caminhoDeLinha, escalaTemporal, escalaVertical, faixa, faixasDeCondicao,
  marcasDeTempo, normalizar, rotuloDeTempo, tetoMedido,
} from '../core/serie.js'

const L = 640, A = 220, ME = 46, MD = 16, MT = 12, MB = 26
const largura = L - ME - MD
const altura = A - MT - MB

const VARIAVEIS = [
  { chave: 'teto', nome: 'Teto', unidade: 'ft', cor: '#38bdf8',
    valorDe: (p) => tetoMedido(p.teto_ft) },
  { chave: 'visibilidade', nome: 'Visibilidade', unidade: 'm', cor: '#a78bfa',
    valorDe: (p) => p.visibilidade_m },
  { chave: 'temperatura', nome: 'Temperatura', unidade: '°C', cor: '#fbbf24',
    valorDe: (p) => p.temperatura_c },
  { chave: 'pressao', nome: 'Pressão (QNH)', unidade: 'hPa', cor: '#34d399',
    valorDe: (p) => p.pressao_hpa },
]

const JANELAS = [
  { rotulo: '24 h', horas: 24 },
  { rotulo: '7 dias', horas: 24 * 7 },
  { rotulo: '15 dias', horas: 24 * 15 },
]

const OPACIDADE_POR_CONDICAO = { VFR: 0.18, VFR_ESPECIAL: 0.15 }

/* Fundo pintado pela condição, a legenda identifica. */
function FundoDeCondicoes({ pontos, x }) {
  return faixasDeCondicao(pontos, { x }).map((f, i) => (
    <rect key={i} x={f.inicio} y={MT} width={Math.max(0, f.fim - f.inicio)} height={altura}
          fill={descreverStatus(f.condicao).cor}
          opacity={OPACIDADE_POR_CONDICAO[f.condicao] ?? 0.12} />
  ))
}

function EixoTempo({ pontos, x }) {
  const muitosDias = pontos.length > 60
  return marcasDeTempo(pontos.map((p) => p.momento_utc)).map((m, i) => (
    <text key={i} x={x(m)} y={A - 8} fill="var(--texto-fraco)" fontSize="10"
          textAnchor="middle">{rotuloDeTempo(m, { comData: muitosDias })}</text>
  ))
}

/* Um gráfico por variável, no eixo da unidade real. */
function GraficoVariavel({ variavel, pontos }) {
  const valores = pontos.map(variavel.valorDe)
  const limites = faixa(valores)
  const x = escalaTemporal(pontos.map((p) => p.momento_utc), { esquerda: ME, largura })
  const y = escalaVertical(valores, { topo: MT, altura })

  if (!limites) {
    return (
      <div className="painel-grafico">
        <h3>{variavel.nome}</h3>
        <Vazio icone="📉" titulo="Sem dado no período"
               detalhe={`Nenhuma leitura trouxe ${variavel.nome.toLowerCase()}.`} />
      </div>
    )
  }

  return (
    <div className="painel-grafico">
      <div className="grafico-topo">
        <h3 style={{ color: variavel.cor }}>{variavel.nome}</h3>
        <span className="meta">
          {limites.minimo}–{limites.maximo} {variavel.unidade}
          <strong style={{ color: 'var(--texto)', marginLeft: 8 }}>
            variação {limites.maximo - limites.minimo} {variavel.unidade}
          </strong>
        </span>
      </div>
      <svg viewBox={`0 0 ${L} ${A}`} width="100%" role="img"
           aria-label={`${variavel.nome} ao longo do período`}>
        {[limites.maximo, limites.minimo].map((v, i) => (
          <g key={i}>
            <line x1={ME} y1={y(v)} x2={ME + largura} y2={y(v)}
                  stroke="var(--borda)" strokeDasharray="3 4" />
            <text x={ME - 6} y={y(v) + 4} fill="var(--texto-fraco)" fontSize="10"
                  textAnchor="end">{v}</text>
          </g>
        ))}
        <path d={caminhoDeLinha(pontos, { x, y, valorDe: variavel.valorDe })}
              fill="none" stroke={variavel.cor} strokeWidth="2" strokeLinejoin="round" />
        {pontos.filter((p) => p.tipo === 'SPECI' && variavel.valorDe(p) !== null)
          .map((p, i) => (
            <circle key={i} cx={x(p.momento_utc)} cy={y(variavel.valorDe(p))} r="2.6"
                    fill="var(--fundo)" stroke={variavel.cor} strokeWidth="1.5">
              <title>SPECI · {rotuloDeTempo(p.momento_utc)}</title>
            </circle>
          ))}
        <EixoTempo pontos={pontos} x={x} />
      </svg>
    </div>
  )
}

function GraficoCombinado({ pontos }) {
  const x = escalaTemporal(pontos.map((p) => p.momento_utc), { esquerda: ME, largura })
  const yPct = (n) => MT + altura - n * altura

  return (
    <div className="painel-grafico">
      <div className="grafico-topo">
        <h3>Combinado</h3>
        <span className="meta">séries normalizadas na própria faixa</span>
      </div>
      <svg viewBox={`0 0 ${L} ${A}`} width="100%" role="img"
           aria-label="Quatro variáveis normalizadas sobre as faixas de condição">
        <FundoDeCondicoes pontos={pontos} x={x} />
        {[0, 0.5, 1].map((n) => (
          <g key={n}>
            <line x1={ME} y1={yPct(n)} x2={ME + largura} y2={yPct(n)}
                  stroke="var(--borda)" strokeDasharray="3 4" />
            <text x={ME - 6} y={yPct(n) + 4} fill="var(--texto-fraco)" fontSize="10"
                  textAnchor="end">{n * 100}%</text>
          </g>
        ))}
        {VARIAVEIS.map((v) => {
          const escala = normalizar(pontos.map(v.valorDe))
          const y = (valor) => yPct(escala(valor))
          return (
            <path key={v.chave} d={caminhoDeLinha(pontos, { x, y, valorDe: v.valorDe })}
                  fill="none" stroke={v.cor} strokeWidth="1.8" strokeLinejoin="round"
                  opacity="0.95" />
          )
        })}
        <EixoTempo pontos={pontos} x={x} />
      </svg>
      {/* Fora do SVG, pois dentro dele os rótulos coincidiriam com a
          ponta das linhas e poderiam ser cortados ou sobrepostos. */}
      <div className="legenda-variaveis">
        {VARIAVEIS.map((v) => (
          <span key={v.chave}>
            <i style={{ background: v.cor }} />
            {v.nome}
          </span>
        ))}
      </div>
      <div className="legenda-condicoes">
        <span className="legenda-condicoes-rotulo">Condição do fundo:</span>
        {['VFR', 'VFR_ESPECIAL', 'ABAIXO_MINIMOS_VFR', 'INDETERMINADO'].map((status) => (
          <span key={status}>
            <i style={{ background: descreverStatus(status).cor }} />
            {descreverStatus(status).rotulo}
          </span>
        ))}
      </div>
    </div>
  )
}

// Barra de progresso horizontal, com animação de preenchimento. A tela inteira
// fica preenchida enquanto a barra de progresso estiver visível.
function BarraDeProgresso() {
  return (
    <div className="barra-progresso" role="progressbar" aria-label="Coletando histórico">
      <div className="barra-progresso-preenchimento" />
    </div>
  )
}

// Resumo do período
function ResumoDoPeriodo({ serie }) {
  const comDado = serie.filter((d) => !d.sem_dado)
  if (comDado.length === 0) return null
  const leituras = comDado.reduce((s, d) => s + d.leituras, 0)
  const specis = comDado.reduce((s, d) => s + d.specis, 0)
  const vfr = comDado.reduce((s, d) => s + d.vfr, 0)
  const proporcao = leituras ? Math.round((vfr / leituras) * 100) : 0

  return (
    <div className="numeros" style={{ marginBottom: 18 }}>
      <div className="numero">
        <div className="valor">{proporcao}%</div><div className="rotulo">leituras VFR</div>
      </div>
      <div className="numero">
        <div className="valor">{leituras}</div><div className="rotulo">leituras</div>
      </div>
      <div className="numero">
        <div className="valor">{specis}</div><div className="rotulo">SPECI</div>
      </div>
      <div className="numero">
        <div className="valor">{comDado.length}</div><div className="rotulo">dias com dado</div>
      </div>
    </div>
  )
}

// Coleta de dados
const TENTATIVAS_SEM_DADO = 24
const INTERVALO_ENTRE_TENTATIVAS_MS = 10000
const LIMIAR_RECENCIA_MS = 3 * 3600 * 1000

function ultimaLeituraMuitoAntiga(lado) {
  if (lado.leituras.length === 0) return true
  const maisRecente = Math.max(...lado.leituras.map((l) => new Date(l.momento_utc).getTime()))
  return Date.now() - maisRecente > LIMIAR_RECENCIA_MS
}

/* Painel de tendência com quatro gráficos separados e um combinado, por aeródromo. */
export function PainelTendencia({ rota }) {
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [icao, setIcao] = useState(null)
  const [horas, setHoras] = useState(24 * 7)
  const [aguardandoColeta, setAguardandoColeta] = useState(false)

  useEffect(() => {
    if (!rota) return
    let cancelado = false
    let tentativas = 0

    const carregar = () => {
      api.historicoDaRota(rota.id, 15)
        .then((resposta) => {
          if (cancelado) return
          setDados(resposta)
          setIcao((atual) => atual || resposta.origem.icao)
          setErro('')
          const semDadoRecente = ultimaLeituraMuitoAntiga(resposta.origem) || ultimaLeituraMuitoAntiga(resposta.destino)
          if (semDadoRecente && tentativas < TENTATIVAS_SEM_DADO) {
            tentativas += 1
            setAguardandoColeta(true)
            setTimeout(() => !cancelado && carregar(), INTERVALO_ENTRE_TENTATIVAS_MS)
          } else {
            setAguardandoColeta(false)
          }
        })
        .catch((e) => !cancelado && setErro(e.message))
        .finally(() => !cancelado && setCarregando(false))
    }
    setCarregando(true)
    carregar()
    return () => { cancelado = true }
  }, [rota?.id])

  if (carregando) return <section className="painel"><Carregando texto="Carregando histórico" /></section>
  if (erro) return <section className="painel"><Vazio icone="⚠️" titulo="Histórico indisponível" detalhe={erro} /></section>
  if (!dados) return null

  const lado = dados.origem.icao === icao ? dados.origem : dados.destino
  const corte = Date.now() - horas * 3600 * 1000
  const pontos = lado.leituras.filter((p) => new Date(p.momento_utc).getTime() >= corte)

  return (
    <section className="painel">
      <div className="cabecalho-secao" style={{ marginTop: 0 }}>
        <h2>Tendência — {lado.icao}</h2>
        <div className="chave-linha">
          <div className="segmentado">
            {[dados.origem, dados.destino].map((l) => (
              <button key={l.icao} type="button" className={l.icao === icao ? 'ativo' : ''}
                      onClick={() => setIcao(l.icao)}>{l.icao}</button>
            ))}
          </div>
          <div className="segmentado">
            {JANELAS.map((j) => (
              <button key={j.horas} type="button" className={j.horas === horas ? 'ativo' : ''}
                      onClick={() => setHoras(j.horas)}>{j.rotulo}</button>
            ))}
          </div>
        </div>
      </div>

      {pontos.length === 0 ? (
        aguardandoColeta ? (
          <div className="vazio">
            <span className="icone" aria-hidden="true">📡</span>
            <strong>Coletando dados no REDEMET, por favor aguarde um instante.</strong>
            <BarraDeProgresso />
            <p style={{ margin: '10px 0 0', fontSize: 13 }}>
              Rota nova: o preenchimento dos 15 dias de histórico pode levar alguns minutos.
              Esta tela atualiza sozinha, sem precisar recarregar.
            </p>
          </div>
        ) : (
          <Vazio icone="🕐" titulo="Sem leituras nesta janela"
                 detalhe="Amplie o período ou dispare a coleta do histórico." />
        )
      ) : (
        <>
          <ResumoDoPeriodo serie={lado.serie_diaria} />
          <GraficoCombinado pontos={pontos} />
          <div className="grade-graficos">
            {VARIAVEIS.map((v) => (
              <GraficoVariavel key={v.chave} variavel={v} pontos={pontos} />
            ))}
          </div>
          <p className="meta" style={{ marginTop: 6 }}>
            {pontos.length} leituras no período · círculos marcam SPECI, emitidos quando a
            condição muda de forma significativa. Onde falta leitura, a linha liga ao próximo
            ponto disponível — nenhum valor é interpolado.
          </p>
        </>
      )}
    </section>
  )
}
