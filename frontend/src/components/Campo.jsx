export default function Campo({ rotulo, nome, valor, aoMudar, erro, obrigatorio, children, ...resto }) {
  return (
    <label className={`campo ${erro ? 'com-erro' : ''}`}>
      <span>{rotulo}{obrigatorio && ' *'}</span>
      {children || (
        <input name={nome} value={valor ?? ''} onChange={(e) => aoMudar(nome, e.target.value)} {...resto} />
      )}
      {erro && <small className="msg-erro">{erro}</small>}
    </label>
  );
}
