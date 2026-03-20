import { useEffect, useState } from 'react'

const API_BASE = "http://192.168.68.120:8000"

function App() {
  const [gados, setGados] = useState([])
  const [view, setView] = useState('grid') 
  const [selecionado, setSelecionado] = useState(null)
  const [foto, setFoto] = useState(null)
  
  // Modelo padrão para evitar erros de "undefined"
  const modeloDadosExtras = { 
    peso: 0, 
    genero: 'Macho', 
    ultima_vacina: '', 
    preco_kg: 0, 
    preco_total: 0 
  }

  const [formData, setFormData] = useState({
    brinco: '', nome: '', nascimento: '', raca_id: 1,
    dados_extras: modeloDadosExtras
  })

  const carregarGados = () => {
    fetch(`${API_BASE}/gados/`)
      .then(res => res.json())
      .then(data => setGados(data))
      .catch(err => console.error("Erro ao carregar:", err))
  }

  useEffect(() => carregarGados(), [])

  // FUNÇÃO DE SEGURANÇA: Garante que o gado tenha a estrutura de dados extras
  const prepararEdicao = (gado) => {
    const gadoFormatado = {
      ...gado,
      dados_extras: {
        ...modeloDadosExtras, // Valores padrão
        ...(gado.dados_extras || {}) // Valores que já existem no banco (se houver)
      }
    }
    setFormData(gadoFormatado)
    setView('formulario')
  }

  const handleExtraChange = (campo, valor) => {
    const novosDadosExtras = { ...formData.dados_extras, [campo]: valor }
    if (campo === 'peso' || campo === 'preco_kg') {
      const p = campo === 'peso' ? parseFloat(valor || 0) : parseFloat(formData.dados_extras.peso || 0)
      const v = campo === 'preco_kg' ? parseFloat(valor || 0) : parseFloat(formData.dados_extras.preco_kg || 0)
      novosDadosExtras.preco_total = (p * v).toFixed(2)
    }
    setFormData({ ...formData, dados_extras: novosDadosExtras })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const method = formData.id ? 'PUT' : 'POST'
    const url = formData.id ? `${API_BASE}/gados/${formData.id}` : `${API_BASE}/gados/`

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const gadoSalvo = await res.json()

      if (foto && gadoSalvo.id) {
        const formFoto = new FormData()
        formFoto.append('file', foto)
        await fetch(`${API_BASE}/gados/${gadoSalvo.id}/upload-foto`, { method: 'POST', body: formFoto })
      }

      setView('grid')
      setFormData({ brinco: '', nome: '', nascimento: '', raca_id: 1, dados_extras: modeloDadosExtras })
      setFoto(null)
      carregarGados()
    } catch (err) {
      alert("Erro ao salvar")
    }
  }

  // Cálculos do Dashboard
  const pesoTotal = gados.reduce((acc, g) => acc + parseFloat(g.dados_extras?.peso || 0), 0)
  const valorPatrimonio = gados.reduce((acc, g) => acc + parseFloat(g.dados_extras?.preco_total || 0), 0)

  const styles = {
    page: { backgroundImage: 'url("/fazenda.jpg")', backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: 'white' },
    overlay: { backgroundColor: 'rgba(0,0,0,0.5)', minHeight: '100vh', padding: '20px', backdropFilter: 'blur(2px)' },
    titulo: { textAlign: 'center', textShadow: '2px 2px 8px rgba(0,0,0,0.8)', fontSize: '2.5rem', marginBottom: '10px' },
    statCard: { background: 'rgba(255, 255, 255, 0.9)', padding: '15px', borderRadius: '12px', textAlign: 'center', color: '#2c3e50', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' },
    cardMini: { background: 'white', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', color: '#333', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' },
    modal: { background: 'white', padding: '30px', borderRadius: '20px', maxWidth: '600px', margin: '40px auto', color: '#333', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
    input: { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }
  }

  return (
    <div style={styles.page}>
      <div style={styles.overlay}>
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={styles.titulo}>Fazenda do Vale Araujo</h1>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', maxWidth: '800px', margin: '20px auto' }}>
            <div style={styles.statCard}><small>Total Gado</small><div style={{fontSize: '1.4rem', fontWeight: 'bold'}}>{gados.length}</div></div>
            <div style={styles.statCard}><small>Peso Total</small><div style={{fontSize: '1.4rem', fontWeight: 'bold'}}>{pesoTotal.toLocaleString()} kg</div></div>
            <div style={styles.statCard}><small>Patrimônio</small><div style={{fontSize: '1.4rem', fontWeight: 'bold', color: '#27ae60'}}>R$ {valorPatrimonio.toLocaleString()}</div></div>
          </div>

          <button onClick={() => { setFormData({brinco:'', nome:'', nascimento:'', raca_id:1, dados_extras:modeloDadosExtras}); setView('formulario'); }}
            style={{ background: '#27ae60', color: 'white', padding: '15px 30px', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold' }}>
            + Cadastrar Novo Animal
          </button>
        </header>

        {view === 'grid' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '25px', maxWidth: '1100px', margin: 'auto' }}>
            {gados.map(gado => (
              <div key={gado.id} style={styles.cardMini} onClick={() => { setSelecionado(gado); setView('detalhes'); }}>
                <img src={gado.foto_url || 'https://via.placeholder.com/200?text=Sem+Foto'} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <div style={{padding: '12px', textAlign: 'center'}}>
                  <h4 style={{ margin: '0' }}>{gado.nome || 'Sem Nome'}</h4>
                  <span style={{ color: '#666', fontSize: '0.85rem' }}>Brinco: {gado.brinco}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'detalhes' && selecionado && (
          <div style={styles.modal}>
            <button onClick={() => setView('grid')} style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: '#eee', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>✕</button>
            <img src={selecionado.foto_url || 'https://via.placeholder.com/400'} style={{ width: '100%', borderRadius: '12px', marginBottom: '20px', maxHeight: '300px', objectFit: 'cover' }} />
            <h2>{selecionado.nome} <span style={{ color: '#888', fontWeight: 'normal' }}>#{selecionado.brinco}</span></h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
              <p><strong>Gênero:</strong> {selecionado.dados_extras?.genero || 'Macho'}</p>
              <p><strong>Peso:</strong> {selecionado.dados_extras?.peso || 0} kg</p>
              <p><strong>Nascimento:</strong> {selecionado.nascimento}</p>
              <p><strong>Vacina:</strong> {selecionado.dados_extras?.ultima_vacina || '---'}</p>
            </div>
            <div style={{ background: '#ebf9f1', padding: '15px', borderRadius: '12px', marginTop: '20px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, color: '#155724' }}>R$ {selecionado.dados_extras?.preco_total || 0}</h3>
            </div>
            <div style={{ marginTop: '25px', display: 'flex', gap: '10px' }}>
              <button onClick={() => prepararEdicao(selecionado)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #007bff', color: '#007bff', background: 'white', cursor: 'pointer' }}>Editar</button>
              <button onClick={() => { if(window.confirm("Excluir?")) { fetch(`${API_BASE}/gados/${selecionado.id}`, {method:'DELETE'}).then(() => {setView('grid'); carregarGados();}) } }} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #dc3545', color: '#dc3545', background: 'white', cursor: 'pointer' }}>Excluir</button>
            </div>
          </div>
        )}

        {view === 'formulario' && (
          <div style={styles.modal}>
            <button onClick={() => setView('grid')} style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: '#eee', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>✕</button>
            <h2 style={{marginTop: 0}}>{formData.id ? '📝 Editar Animal' : '➕ Novo Cadastro'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input style={styles.input} type="text" placeholder="Brinco" value={formData.brinco} onChange={e => setFormData({...formData, brinco: e.target.value})} required />
                <input style={styles.input} type="text" placeholder="Nome" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input style={styles.input} type="date" value={formData.nascimento} onChange={e => setFormData({...formData, nascimento: e.target.value})} required />
                <select style={styles.input} value={formData.dados_extras.genero} onChange={e => handleExtraChange('genero', e.target.value)}>
                  <option value="Macho">Macho</option>
                  <option value="Fêmea">Fêmea</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input style={styles.input} type="number" placeholder="Peso" value={formData.dados_extras.peso} onChange={e => handleExtraChange('peso', e.target.value)} />
                <input style={styles.input} type="number" step="0.01" placeholder="R$/kg" value={formData.dados_extras.preco_kg} onChange={e => handleExtraChange('preco_kg', e.target.value)} />
              </div>
              <div style={{ ...styles.input, background: '#f8f9fa', textAlign: 'center', fontWeight: 'bold' }}>Total: R$ {formData.dados_extras.preco_total}</div>
              <label>Última Vacina:</label>
              <input style={styles.input} type="date" value={formData.dados_extras.ultima_vacina} onChange={e => handleExtraChange('ultima_vacina', e.target.value)} />
              <input type="file" onChange={e => setFoto(e.target.files[0])} style={{margin: '10px 0 20px 0'}} />
              <button type="submit" style={{ background: '#27ae60', color: 'white', border: 'none', width: '100%', padding: '15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Salvar Animal</button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
