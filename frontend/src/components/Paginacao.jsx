export default function Paginacao({ pagina, limite, total, aoMudar }) {
  const totalPaginas = Math.max(Math.ceil(total / limite), 1);
  const inicio = total === 0 ? 0 : (pagina - 1) * limite + 1;
  const fim = Math.min(pagina * limite, total);

  return (
    <div className="paginacao">
      <span>
        {total === 0 ? 'Nenhum registro' : `Mostrando ${inicio}–${fim} de ${total} registros`}
      </span>

      <div>
        <button
          disabled={pagina <= 1}
          onClick={() => aoMudar(pagina - 1)}
        >
          ◀
        </button>

        <span>
          {pagina} / {totalPaginas}
        </span>

        <button
          disabled={pagina >= totalPaginas}
          onClick={() => aoMudar(pagina + 1)}
        >
          ▶
        </button>
      </div>
    </div>
  );
};