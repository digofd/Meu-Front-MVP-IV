function pontoNoCirculo(cx, cy, raio, fracao) {
  const angulo = fracao * 2 * Math.PI - Math.PI / 2
  return [cx + raio * Math.cos(angulo), cy + raio * Math.sin(angulo)]
}

export function fatiasDeRosca(dados, { cx = 60, cy = 60, raio = 52, espessura = 18 } = {}) {
  const total = dados.reduce((soma, item) => soma + item.valor, 0)
  if (total === 0) return []
  const interno = raio - espessura
  let acumulado = 0

  return dados
    .filter((item) => item.valor > 0)
    .map((item) => {
      const inicio = acumulado / total
      acumulado += item.valor
      const fim = acumulado / total
      const arcoGrande = fim - inicio > 0.5 ? 1 : 0
      const [x1, y1] = pontoNoCirculo(cx, cy, raio, inicio)
      const [x2, y2] = pontoNoCirculo(cx, cy, raio, fim)
      const [x3, y3] = pontoNoCirculo(cx, cy, interno, fim)
      const [x4, y4] = pontoNoCirculo(cx, cy, interno, inicio)
      // Fatia única de 100%: dois arcos completam o anel sem costura visível.
      const d =
        fim - inicio >= 1
          ? `M ${cx - raio} ${cy} A ${raio} ${raio} 0 1 1 ${cx + raio} ${cy}
             A ${raio} ${raio} 0 1 1 ${cx - raio} ${cy} Z
             M ${cx - interno} ${cy} A ${interno} ${interno} 0 1 0 ${cx + interno} ${cy}
             A ${interno} ${interno} 0 1 0 ${cx - interno} ${cy} Z`
          : `M ${x1} ${y1} A ${raio} ${raio} 0 ${arcoGrande} 1 ${x2} ${y2}
             L ${x3} ${y3} A ${interno} ${interno} 0 ${arcoGrande} 0 ${x4} ${y4} Z`
      return { ...item, d, percentual: (item.valor / total) * 100 }
    })
}

export function barrasProporcionais(dados) {
  const maior = Math.max(...dados.map((item) => item.valor), 0)
  if (maior === 0) return dados.map((item) => ({ ...item, largura: 0 }))
  return dados.map((item) => ({ ...item, largura: (item.valor / maior) * 100 }))
}
