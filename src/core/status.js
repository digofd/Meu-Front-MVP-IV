export const STATUS = {
  VFR: {
    rotulo: 'VFR',
    descricao: 'Dentro dos mínimos VMC da ICA 100-12',
    cor: 'var(--verde)',
    icone: '✓',
  },
  VFR_ESPECIAL: {
    rotulo: 'VFR Especial',
    descricao: 'Teto ≥ 1.000 ft e visibilidade ≥ 3.000 m, diurno, dentro de ' +
               'CTR/ATZ (ICA 100-12, Art. 134)',
    cor: 'var(--ambar)',
    icone: '✦',
    // O sistema confirma teto/visibilidade, diurno e CTR/ATZ (via AISWEB)
    // as outras duas condições do Art. 134 não têm fonte de dado e ficam como
    // aviso: quem operar precisa checar por conta própria.
    condicoesOperacionais: [
      'Exige autorização prévia do ATC (APP ou TWR)',
      'Aeronave equipada com rádio VHF bidirecional operante',
    ],
  },
  ABAIXO_MINIMOS_VFR: {
    rotulo: 'IFR',
    descricao: 'Abaixo do mínimo VMC da ICA 100-12 — exige voo por instrumentos (IFR)',
    cor: 'var(--vermelho)',
    icone: '✕',
  },
  INDETERMINADO: {
    rotulo: 'Indeterminado',
    descricao: 'Dados insuficientes na mensagem',
    cor: 'var(--cinza)',
    icone: '?',
  },
}

const DESCONHECIDO = {
  rotulo: 'Sem leitura',
  descricao: 'Nenhuma observação coletada ainda',
  cor: 'var(--cinza)',
  icone: '–',
}

/* Metadados de exibição de um status, nunca devolve indefinido. */
export function descreverStatus(status) {
  return STATUS[status] || DESCONHECIDO
}

/* Data legível em pt-BR */
export function formatarData(iso) {
  if (!iso) return '—'
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return '—'
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/* Visibilidade em metros para texto curto: 10000 vira "10 km ou mais". */
export function formatarVisibilidade(metros) {
  if (metros === null || metros === undefined) return '—'
  if (metros >= 10000) return '10 km ou mais'
  if (metros >= 1000) return `${(metros / 1000).toLocaleString('pt-BR')} km`
  return `${metros} m`
}

/* Teto em pés, o valor 99999 significa sem camada de nuvens significativa. */
export function formatarTeto(pes) {
  if (pes === null || pes === undefined) return 'sem teto'
  if (pes >= 99999) return 'ilimitado'
  return `${pes.toLocaleString('pt-BR')} ft`
}

/*
 Proporção de observações VFR, de 0 a 1.
 Sem observações, devolve null, que é diferente de 0%.
 */
export function proporcaoVfr(porStatus) {
  const total = Object.values(porStatus || {}).reduce((soma, n) => soma + n, 0)
  if (total === 0) return null
  return (porStatus.VFR || 0) / total
}
