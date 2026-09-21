/** Copia o texto e informa se conseguiu, não lança. */
export async function copiar(texto) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(texto)
      return true
    } catch {
      /* sem permissão ou contexto inseguro */
    }
  }
  return copiarPorSelecao(texto)
}

/* Recuo para navegadores ou contextos sem Clipboard API. */
function copiarPorSelecao(texto) {
  const area = document.createElement('textarea')
  area.value = texto
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  try {
    area.select()
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(area)
  }
}
