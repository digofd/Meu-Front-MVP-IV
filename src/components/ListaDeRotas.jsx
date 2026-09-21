import { SeloStatus, Vazio, Carregando } from './Basicos.jsx'
import { formatarData } from '../core/status.js'

/* Filtros, ordenação e paginação, tudo vira query string do GET /routes. */
export function Filtros({ criterio, aoMudar }) {
  const atualizar = (campo) => (evento) =>
    aoMudar({ ...criterio, [campo]: evento.target.value, pagina: 1 })

  return (
    <div className="filtros" style={{ marginBottom: 16 }}>
      <div className="campo" style={{ margin: 0 }}>
        <label htmlFor="icao">Buscar por ICAO</label>
        <input id="icao" value={criterio.icao} placeholder="SBSP"
               maxLength={4} onChange={atualizar('icao')} />
      </div>
      <div className="campo" style={{ margin: 0 }}>
        <label htmlFor="ativa">Situação</label>
        <select id="ativa" value={criterio.ativa} onChange={atualizar('ativa')}>
          <option value="">Todas</option>
          <option value="true">Somente ativas</option>
          <option value="false">Somente inativas</option>
        </select>
      </div>
      <div className="campo" style={{ margin: 0 }}>
        <label htmlFor="ordenar">Ordenar por</label>
        <select id="ordenar" value={criterio.ordenar_por} onChange={atualizar('ordenar_por')}>
          <option value="criado_em">Data de criação</option>
          <option value="origem_icao">Origem</option>
          <option value="destino_icao">Destino</option>
          <option value="id">Identificador</option>
        </select>
      </div>
      <div className="campo" style={{ margin: 0 }}>
        <label htmlFor="ordem">Direção</label>
        <select id="ordem" value={criterio.ordem} onChange={atualizar('ordem')}>
          <option value="desc">Decrescente</option>
          <option value="asc">Crescente</option>
        </select>
      </div>
    </div>
  )
}

/* Um cartão de rota, com as ações de PUT e DELETE. */
function CartaoRota({ rota, resumo, selecionada, aoSelecionar, aoAlternar, aoRemover }) {
  const status = resumo?.status_atual
  const classes = ['rota', selecionada ? 'selecionada' : '', rota.ativa ? '' : 'inativa']

  return (
    <article className={classes.join(' ')} onClick={() => aoSelecionar(rota)}
             style={{ borderLeftColor: status ? undefined : 'var(--cinza)' }}>
      <div className="rota-topo">
        <span className="par-icao">{rota.origem_icao}</span>
        <span className="seta" aria-label="para">→</span>
        <span className="par-icao">{rota.destino_icao}</span>
        <span style={{ marginLeft: 'auto' }}>
          <SeloStatus status={status} />
        </span>
      </div>
      <div className="meta">
        {rota.total_observations} observações · criada em {formatarData(rota.criado_em)}
        {!rota.ativa && ' · fora da coleta horária'}
      </div>
      {
        /* O `title` não entra nestes botões: em vários leitores ele substitui o
          texto visível como nome acessível, e "DELETE /routes/{id}…" não é o que
          alguém precisa ouvir. O rótulo visível já diz o que a ação faz. 
        */
          }
      <div className="acoes" onClick={(evento) => evento.stopPropagation()}>
        <button className="secundario pequeno" onClick={() => aoAlternar(rota)}>
          {rota.ativa ? 'Desativar' : 'Ativar'}
        </button>
        <button className="perigo pequeno" onClick={() => aoRemover(rota)}>
          Excluir
        </button>
      </div>
    </article>
  )
}

/* Lista paginada de rotas. */
export function ListaDeRotas({
  pagina, carregando, criterio, resumos, selecionada,
  aoMudarCriterio, aoSelecionar, aoAlternar, aoRemover,
}) {
  const irPara = (numero) => aoMudarCriterio({ ...criterio, pagina: numero })

  return (
    <section className="painel">
      <h2>Rotas monitoradas</h2>
      <Filtros criterio={criterio} aoMudar={aoMudarCriterio} />

      {carregando && <Carregando texto="Buscando rotas" />}

      {!carregando && pagina.itens.length === 0 && (
        <Vazio titulo="Nenhuma rota encontrada"
               detalhe="Ajuste os filtros ou cadastre a primeira rota ao lado." />
      )}

      {!carregando && pagina.itens.length > 0 && (
        <>
          <div className="lista">
            {pagina.itens.map((rota) => (
              <CartaoRota key={rota.id} rota={rota} resumo={resumos[rota.id]}
                          selecionada={selecionada?.id === rota.id}
                          aoSelecionar={aoSelecionar} aoAlternar={aoAlternar}
                          aoRemover={aoRemover} />
            ))}
          </div>
          <div className="paginacao">
            <span className="meta">
              {pagina.total} rota(s) · página {pagina.pagina} de {pagina.paginas || 1}
            </span>
            <span className="acoes">
              <button className="secundario pequeno" disabled={pagina.pagina <= 1}
                      onClick={() => irPara(pagina.pagina - 1)}>Anterior</button>
              <button className="secundario pequeno" disabled={pagina.pagina >= pagina.paginas}
                      onClick={() => irPara(pagina.pagina + 1)}>Próxima</button>
            </span>
          </div>
        </>
      )}
    </section>
  )
}
