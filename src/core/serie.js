
export const TETO_SEM_CAMADA_FT = 99999

/* Teto medido, ou null se sem camada significativa. */
export function tetoMedido(tetoFt) {
  if (tetoFt === null || tetoFt === undefined || tetoFt >= TETO_SEM_CAMADA_FT) return null
  return tetoFt
}

/* Menor e maior valor presentes, ignorando ausências. */
export function faixa(valores) {
  const presentes = valores.filter((v) => v !== null && v !== undefined)
  if (presentes.length === 0) return null
  return { minimo: Math.min(...presentes), maximo: Math.max(...presentes) }
}

/*
  Escala linear de valor para pixel, com folga de 8% nas pontas.
  Faixa de um único valor não divide por zero: fica no meio da altura.
 */
export function escalaVertical(valores, { topo, altura }) {
  const f = faixa(valores)
  if (!f) return () => topo + altura / 2
  const folga = (f.maximo - f.minimo) * 0.08 || 1
  const min = f.minimo - folga
  const max = f.maximo + folga
  return (valor) => topo + altura - ((valor - min) / (max - min)) * altura
}

/* Escala de tempo para pixel a partir dos instantes reais das leituras. */
export function escalaTemporal(momentos, { esquerda, largura }) {
  const ts = momentos.map((m) => new Date(m).getTime())
  const inicio = Math.min(...ts)
  const fim = Math.max(...ts)
  if (!Number.isFinite(inicio) || fim === inicio) return () => esquerda
  return (momento) =>
    esquerda + ((new Date(momento).getTime() - inicio) / (fim - inicio)) * largura
}

/*
  Caminho SVG de uma série, pulando as ausências.
  Os pontos sem valor são descartados e os vizinhos ligados diretamente sem interpolação.
*/
export function caminhoDeLinha(pontos, { x, y, valorDe }) {
  const validos = pontos.filter((p) => valorDe(p) !== null && valorDe(p) !== undefined)
  if (validos.length === 0) return ''
  return validos
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.momento_utc).toFixed(1)} ${y(valorDe(p)).toFixed(1)}`)
    .join(' ')
}

/* Normaliza para 0–1 dentro da própria faixa; série constante fica em 0,5. */
export function normalizar(valores) {
  const f = faixa(valores)
  if (!f) return () => null
  if (f.maximo === f.minimo) return (v) => (v === null || v === undefined ? null : 0.5)
  return (v) => (v === null || v === undefined ? null : (v - f.minimo) / (f.maximo - f.minimo))
}

/* Trechos contíguos de mesma condição, para pintar o fundo do gráfico combinado. */
export function faixasDeCondicao(pontos, { x }) {
  if (pontos.length === 0) return []
  const limites = pontos.map((p, i) => {
    const anterior = pontos[i - 1]
    const proximo = pontos[i + 1]
    const atual = x(p.momento_utc)
    return {
      inicio: anterior ? (atual + x(anterior.momento_utc)) / 2 : atual,
      fim: proximo ? (atual + x(proximo.momento_utc)) / 2 : atual,
      condicao: p.status_operacional || 'INDETERMINADO',
    }
  })
  return limites.reduce((juntas, faixa) => {
    const ultima = juntas[juntas.length - 1]
    if (ultima && ultima.condicao === faixa.condicao) {
      ultima.fim = faixa.fim
      return juntas
    }
    return [...juntas, { ...faixa }]
  }, [])
}

  export function marcasDeTempo(momentos, quantidade = 5) {
  if (momentos.length === 0) return []
  const tempos = momentos.map((m) => new Date(m).getTime())
  const inicio = tempos[0]
  const fim = tempos[tempos.length - 1]
  const vao = fim - inicio
  const passo = Math.max(1, Math.floor((momentos.length - 1) / (quantidade - 1)))
  const indices = []
  for (let i = 0; i < momentos.length; i += passo) indices.push(i)
  const ultimoIndice = momentos.length - 1
  if (indices[indices.length - 1] !== ultimoIndice) {
    const limiar = vao > 0 ? vao / (quantidade - 1) / 2 : 0
    const distancia = tempos[ultimoIndice] - tempos[indices[indices.length - 1]]
    if (distancia < limiar) {
      indices[indices.length - 1] = ultimoIndice
    } else {
      indices.push(ultimoIndice)
    }
  }
  return indices.map((i) => momentos[i])
}

/* Rótulo curto de eixo: dia/mês e hora em Z, que é o fuso da aviação. */
export function rotuloDeTempo(momento, { comData = true } = {}) {
  const d = new Date(momento)
  const hora = `${String(d.getUTCHours()).padStart(2, '0')}Z`
  if (!comData) return hora
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')} ${hora}`
}
