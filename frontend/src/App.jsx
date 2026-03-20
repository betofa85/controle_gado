import { useEffect, useState } from 'react'

const API_BASE = "http://192.168.68.120:8000"

function App() {
  const [gados, setGados] = useState([])
  const [editando, setEditando] = useState(null) // Armazena o gado que está sendo editado
  const [formData, setFormData] = useState({ brinco: '', nome: '', nascimento: '', raca_id: 1 })
  const [foto, setFoto] = useState(null)

  const carregarGados = () => {
    fetch(`${API_BASE}/gados/`).then(res => res.json()).then(setGados)
  }

  useEffect(() => carregarGados(), [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const method = editando ? 'PUT' : 'POST'
    const url = editando ? `${API_BASE}/gados/${editando.id}` : `${API_BASE}/gados/`

    // 1. Salva os dados de texto
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    const gadoSalvo = await res.json()

    // 2. Se tiver foto, faz o upload
    if (foto && gadoSalvo.id) {
      const formFoto = new FormData()
      formFoto.append('file', foto)
      await fetch(`${API_BASE}/gados/${gadoSalvo.id}/upload-foto`, {
        method: 'POST',
        body: formFoto
      })
    }

    setEditando(null)
    setFormData({ brinco: '', nome: '', nascimento: '', raca_id: 1 })
    setFoto(null)
    carregarGados()
  }

  const deletarGado = async (id) => {
    if (window.confirm("Deseja mesmo remover este animal?")) {
      await fetch(`${API_BASE}/gados/${id}`, { method: 'DELETE' })
      carregarGados()
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <h1>Controle de Gado 🐂</h1>

      {/* FORMULÁRIO */}
      <form onSubmit={handleSubmit} style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px', marginBottom: '40px' }}>
        <h2>{editando ? 'Editar Gado' : 'Novo Gado'}</h2>
        <input type="text" placeholder="Brinco" value={formData.brinco} onChange={e => setFormData({...formData, brinco: e.target.value})} required />
        <input type="text" placeholder="Nome" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
        <input type="date" value={formData.nascimento} onChange={e => setFormData({...formData, nascimento: e.target.value})} required />
        <input type="file" onChange={e => setFoto(e.target.files[0])} />
        <button type="submit" style={{ background: 'green', color: 'white', border: 'none', padding: '10px 20px', marginLeft: '10px' }}>
          {editando ? 'Salvar Alterações' : 'Cadastrar'}
        </button>
        {editando && <button onClick={() => setEditando(null)}>Cancelar</button>}
      </form>

      {/* LISTAGEM */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {gados.map(gado => (
          <div key={gado.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src={gado.foto_url || 'https://via.placeholder.com/100'} alt="gado" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginRight: '20px' }} />
              <div>
                <strong>{gado.nome} ({gado.brinco})</strong>
                <p style={{ margin: 0, color: '#666' }}>Nasc: {gado.nascimento}</p>
              </div>
            </div>
            <div>
              <button onClick={() => { setEditando(gado); setFormData(gado); }} style={{ marginRight: '10px' }}>Editar</button>
              <button onClick={() => deletarGado(gado.id)} style={{ color: 'red' }}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
