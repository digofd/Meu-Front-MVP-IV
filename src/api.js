
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8010'

/* Erro de API com a mensagem que veio do servidor, quando existe. */
export class ErroDeApi extends Error {
  constructor(mensagem, status) {
    super(mensagem)
    this.name = 'ErroDeApi'
    this.status = status
  }
}

async function pedir(caminho, opcoes = {}) {
  let resposta
  try {
    // `Content-Type` entra quando é POST/PUT com JSON.
    resposta = await fetch(`${BASE}${caminho}`, {
      ...(opcoes.body ? { headers: { 'Content-Type': 'application/json' } } : {}),
      ...opcoes,
    })
  } catch (causa) {
    throw new ErroDeApi(`API indisponível em ${BASE}`, 0)
  }
  if (!resposta.ok) throw new ErroDeApi(await extrairErro(resposta), resposta.status)
  return resposta.status === 204 ? null : resposta.json()
}

/* Extrai a mensagem de erro do corpo, com recuo para o status HTTP. */
async function extrairErro(resposta) {
  try {
    const corpo = await resposta.json()
    const detalhe = corpo.detail
    if (typeof detalhe === 'string') return detalhe
    if (Array.isArray(detalhe)) return detalhe.map((d) => d.msg).join('; ')
  } catch {
    // corpo não era JSON ou não tinha `detail`.
  }
  return `HTTP ${resposta.status}`
}

/* Monta a query string ignorando filtros não preenchidos. */
function query(parametros) {
  const busca = new URLSearchParams()
  Object.entries(parametros).forEach(([chave, valor]) => {
    if (valor !== '' && valor !== null && valor !== undefined) busca.set(chave, valor)
  })
  return busca.toString()
}

export const api = {
  /* GET — lista paginada, com filtro e ordenação. */
  listarRotas: (parametros) => pedir(`/routes?${query(parametros)}`),

  /* GET — resumo agregado de uma rota, para o painel. */
  resumoDaRota: (id) => pedir(`/routes/${id}/resumo`),

  /* GET — rota com as observações mais recentes sem paginação */
  buscarRota: (id) => pedir(`/routes/${id}`),

  /* GET — METAR e TAF da rota numa janela de horas, paginados. */
  observacoesDaRota: (id, parametros) => pedir(`/routes/${id}/observacoes?${query(parametros)}`),
  
  /* POST — cria a rota e dispara a primeira coleta. */
  criarRota: (rota) => pedir('/routes', { method: 'POST', body: JSON.stringify(rota) }),

  /* PUT — ativa ou desativa a rota na coleta horária. */
  alterarRota: (id, ativa) =>
    pedir(`/routes/${id}`, { method: 'PUT', body: JSON.stringify({ ativa }) }),

  /* DELETE — remove a rota, em cascata, suas observações. */
  removerRota: (id) => pedir(`/routes/${id}`, { method: 'DELETE' }),

  /* GET — série histórica dos dois aeródromos da rota. */
  historicoDaRota: (id, dias) => pedir(`/historico/rota/${id}?dias=${dias}`),

  /* POST — preenche o histórico dos 15 dias. */
  coletarHistorico: () => pedir('/historico/coletar', { method: 'POST' }),

  /* GET — prontidão da API e do banco. */
  saude: () => pedir('/health'),
}

export const URL_DA_API = BASE
