import { useEffect, useState } from 'react'

const API_BASE = "http://192.168.68.120:8000"

function App() {
  const [gados, setGados] = useState([])
  const [view, setView] = useState('grid')
  const [selecionado, setSelecionado] = useState(null)
  const [foto, setFoto] = useState(null)
  const [infoFazenda, setInfoFazenda] = useState({ nome: '', localizacao: '', area_hectares: 0 })

  const modeloExtras = { peso: 0, genero: 'Macho', ultima_vacina: '', preco_kg: 0, preco_total: 0 }
  const [formData, setFormData] = useState({ brinco: '', nome: '', nascimento: '', dados_extras: modeloExtras })

  const carregarDados = () => {
    fetch(`${API_BASE}/gados/`).then(res => res.json()).then(setGados)
    fetch(`${API_BASE}/fazenda/1`).then(res => res.json()).then(setInfoFazenda)
  }

  useEffect(() => carregarDados(), [])

  const handleExtraChange = (campo, valor) => {
    const novosExtras = { ...formData.dados_extras, [campo]: valor }
    if (campo === 'peso' || campo === 'preco_kg') {
      const p = parseFloat(campo === 'peso' ? valor : formData.dados_extras.peso) || 0
      const v = parseFloat(campo === 'preco_kg' ? valor : formData.dados_extras.preco_kg) || 0
      novosExtras.preco_total = (p * v).toFixed(2)
    }
    setFormData({ ...formData, dados_extras: novosExtras })
  }

  const handleSubmitGado = async (e) => {
    e.preventDefault()
    const method = formData.id ? 'PUT' : 'POST'
    const url = formData.id ? `${API_BASE}/gados/${formData.id}` : `${API_BASE}/gados/`
    const res = await fetch(url, { method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(formData) })
    const salvo = await res.json()
    if (foto && salvo.id) {
      const fd = new FormData(); fd.append('file', foto)
      await fetch(`${API_BASE}/gados/${salvo.id}/upload-foto`, { method: 'POST', body: fd })
    }
    setView('grid'); setFoto(null); carregarDados()
  }

  const handleSalvarFazenda = async (e) => {
    e.preventDefault()
    await fetch(`${API_BASE}/fazenda/1`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(infoFazenda) })
    setView('grid'); carregarDados()
  }

  // CÁLCULOS DASHBOARD
  const pesoTotal = gados.reduce((acc, g) => acc + parseFloat(g.dados_extras?.peso || 0), 0)
  const valorTotal = gados.reduce((acc, g) => acc + parseFloat(g.dados_extras?.preco_total || 0), 0)

  const styles = {
    page: { backgroundImage: 'url("/fazenda.jpg")', backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: 'white' },
    overlay: { backgroundColor: 'rgba(0,0,0,0.6)', minHeight: '100vh', padding: '20px', backdropFilter: 'blur(2px)' },
    card: { background: 'white', borderRadius: '12px', padding: '15px', color: '#333', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' },
    input: { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }
  }

  return (
    <div style={styles.page}>
      <div style={styles.overlay}>
        <header style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ textShadow: '2px 2px 10px black', fontSize: '2.5rem', margin: 0 }}>{infoFazenda.nome || "Vale Araujo"}</h1>
          <p style={{ textShadow: '1px 1px 5px black' }}>📍 {infoFazenda.localizacao}</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', maxWidth: '800px', margin: '20px auto' }}>
            <div style={{...styles.card, background: 'rgba(255,255,255,0.9)'}}><b>Gado</b><br/>{gados.length}</div>
            <div style={{...styles.card, background: 'rgba(255,255,255,0.9)'}}><b>Peso</b><br/>{pesoTotal.toLocaleString()} kg</div>
            <div style={{...styles.card, background: 'rgba(255,255,255,0.9)', color: 'green'}}><b>Patrimônio</b><br/>R$ {valorTotal.toLocaleString()}</div>
          </div>

          <div style={{display: 'flex', justifyContent: 'center', gap: '10px'}}>
            <button onClick={() => { setFormData({brinco:'', nome:'', nascimento:'', dados_extras:modeloExtras}); setView('formulario'); }} style={{background: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold'}}>+ Novo Animal</button>
            <button onClick={() => setView('config')} style={{background: '#2c3e50', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer'}}>⚙️ Config</button>
          </div>
        </header>

        {/* VIEW: GRID */}
        {view === 'grid' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px', maxWidth: '1000px', margin: 'auto' }}>
            {gados.map(g => (
              <div key={g.id} style={{...styles.card, padding: 0, cursor: 'pointer', overflow: 'hidden'}} onClick={() => { setSelecionado(g); setView('detalhes'); }}>
                <img src={g.foto_url || 'https://via.placeholder.com/150'} style={{width: '100%', height: '150px', objectFit: 'cover'}} />
                <div style={{padding: '10px', textAlign: 'center'}}><b>{g.nome || "S/N"}</b><br/><small>#{g.brinco}</small></div>
              </div>
            ))}
          </div>
        )}

        {/* VIEW: DETALHES */}
        {view === 'detalhes' && selecionado && (
          <div style={{...styles.card, maxWidth: '500px', margin: 'auto', position: 'relative'}}>
            <button onClick={() => setView('grid')} style={{position: 'absolute', right: '10px', top: '10px', border: 'none', cursor: 'pointer'}}>✖</button>
            <img src={selecionado.foto_url || 'https://via.placeholder.com/400'} style={{width: '100%', borderRadius: '10px'}} />
            <h2>{selecionado.nome} <small>#{selecionado.brinco}</small></h2>
            <p><b>Gênero:</b> {selecionado.dados_extras?.genero} | <b>Peso:</b> {selecionado.dados_extras?.peso} kg</p>
            <p><b>Vacina:</b> {selecionado.dados_extras?.ultima_vacina || 'Não informada'}</p>
            <h3 style={{color: 'green'}}>Valor: R$ {selecionado.dados_extras?.preco_total}</h3>
            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
              <button onClick={() => { setFormData({...selecionado, dados_extras: {...modeloExtras, ...selecionado.dados_extras}}); setView('formulario'); }} style={{flex: 1}}>Editar</button>
              <button onClick={() => { if(confirm("Excluir?")) fetch(`${API_BASE}/gados/${selecionado.id}`, {method:'DELETE'}).then(() => {setView('grid'); carregarDados();}) }} style={{flex: 1, color: 'red'}}>Excluir</button>
            </div>
          </div>
        )}

        {/* VIEW: FORMULÁRIO GADO */}
        {view === 'formulario' && (
          <div style={{...styles.card, maxWidth: '500px', margin: 'auto'}}>
            <h3>{formData.id ? 'Editar Animal' : 'Novo Cadastro'}</h3>
            <form onSubmit={handleSubmitGado}>
              <input style={styles.input} placeholder="Brinco" value={formData.brinco} onChange={e => setFormData({...formData, brinco: e.target.value})} required />
              <input style={styles.input} placeholder="Nome" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              <input style={styles.input} type="date" value={formData.nascimento} onChange={e => setFormData({...formData, nascimento: e.target.value})} required />
              <div style={{display: 'flex', gap: '5px'}}>
                <input style={styles.input} type="number" placeholder="Peso" value={formData.dados_extras.peso} onChange={e => handleExtraChange('peso', e.target.value)} />
                <input style={styles.input} type="number" step="0.01" placeholder="R$/kg" value={formData.dados_extras.preco_kg} onChange={e => handleExtraChange('preco_kg', e.target.value)} />
              </div>
              <input type="file" onChange={e => setFoto(e.target.files[0])} />
              <button type="submit" style={{width: '100%', padding: '10px', background: '#27ae60', color: 'white', border: 'none', marginTop: '10px'}}>Salvar</button>
              <button type="button" onClick={() => setView('grid')} style={{width: '100%', marginTop: '5px'}}>Cancelar</button>
            </form>
          </div>
        )}

        {/* VIEW: CONFIG FAZENDA */}
        {view === 'config' && (
          <div style={{...styles.card, maxWidth: '500px', margin: 'auto'}}>
            <h3>🏠 Configurações da Fazenda</h3>
            <form onSubmit={handleSalvarFazenda}>
              <label>Nome:</label>
              <input style={styles.input} value={infoFazenda.nome} onChange={e => setInfoFazenda({...infoFazenda, nome: e.target.value})} required />
              <label>Município/Estado:</label>
              <input style={styles.input} value={infoFazenda.localizacao} onChange={e => setInfoFazenda({...infoFazenda, localizacao: e.target.value})} required />
              <label>Área (ha):</label>
              <input style={styles.input} type="number" value={infoFazenda.area_hectares} onChange={e => setInfoFazenda({...infoFazenda, area_hectares: e.target.value})} />
              <button type="submit" style={{width: '100%', padding: '10px', background: '#2c3e50', color: 'white', border: 'none'}}>Salvar Perfil</button>
              <button type="button" onClick={() => setView('grid')} style={{width: '100%', marginTop: '5px'}}>Voltar</button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
