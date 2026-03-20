import { useEffect, useState } from 'react'

const API_BASE = "http://192.168.68.120:8000"

function App() {
  // Estados de Dados
  const [gados, setGados] = useState([])
  const [infoFazenda, setInfoFazenda] = useState({ nome: '', localizacao: '', area_hectares: 0, foto_url: '' })
  
  // Estados de Navegação e Seleção
  const [view, setView] = useState('grid') // 'grid', 'detalhes', 'formulario', 'config'
  const [selecionado, setSelecionado] = useState(null)
  
  // Estados de Arquivos (Fotos)
  const [fotoGado, setFotoGado] = useState(null)
  const [fotoFazenda, setFotoFazenda] = useState(null)

  // Modelo padrão para evitar erros de campos nulos (Bois antigos)
  const modeloExtras = { peso: 0, genero: 'Macho', ultima_vacina: '', preco_kg: 0, preco_total: 0 }
  const [formData, setFormData] = useState({ brinco: '', nome: '', nascimento: '', dados_extras: modeloExtras })

  // --- CARREGAMENTO DE DADOS ---
  const carregarDados = () => {
    fetch(`${API_BASE}/gados/`).then(res => res.json()).then(setGados)
    fetch(`${API_BASE}/fazenda/1`).then(res => res.json()).then(setInfoFazenda)
  }

  useEffect(() => carregarDados(), [])

  // --- LÓGICA DO GADO ---
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
    
    const res = await fetch(url, { 
      method, 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify(formData) 
    })
    const salvo = await res.json()

    if (fotoGado && salvo.id) {
      const fd = new FormData(); fd.append('file', fotoGado)
      await fetch(`${API_BASE}/gados/${salvo.id}/upload-foto`, { method: 'POST', body: fd })
    }

    setFotoGado(null); setView('grid'); carregarDados()
  }

  const prepararEdicao = (gado) => {
    setFormData({
      ...gado,
      dados_extras: { ...modeloExtras, ...(gado.dados_extras || {}) }
    })
    setView('formulario')
  }

  // --- LÓGICA DA FAZENDA ---
  const handleSalvarFazenda = async (e) => {
    e.preventDefault()
    // 1. Salva Textos
    await fetch(`${API_BASE}/fazenda/1`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(infoFazenda)
    })

    // 2. Salva Foto se houver
    if (fotoFazenda) {
      const fd = new FormData(); fd.append('file', fotoFazenda)
      await fetch(`${API_BASE}/fazenda/1/upload-foto`, { method: 'POST', body: fd })
    }

    setFotoFazenda(null); setView('grid'); carregarDados()
  }

  // --- CÁLCULOS DASHBOARD ---
  const pesoTotal = gados.reduce((acc, g) => acc + parseFloat(g.dados_extras?.peso || 0), 0)
  const valorTotal = gados.reduce((acc, g) => acc + parseFloat(g.dados_extras?.preco_total || 0), 0)

  // --- ESTILOS ---
  const styles = {
    page: { 
      backgroundImage: `url("${infoFazenda.foto_url || '/fazenda.jpg'}")`, 
      backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center', 
      minHeight: '100vh', fontFamily: 'sans-serif', color: 'white' 
    },
    overlay: { backgroundColor: 'rgba(0,0,0,0.5)', minHeight: '100vh', padding: '20px', backdropFilter: 'blur(3px)' },
    header: { textAlign: 'center', marginBottom: '40px' },
    card: { background: 'white', borderRadius: '15px', padding: '20px', color: '#333', boxShadow: '0 8px 20px rgba(0,0,0,0.4)', position: 'relative' },
    input: { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' },
    gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '25px', maxWidth: '1100px', margin: 'auto' },
    btnVerde: { background: '#27ae60', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' }
  }

  return (
    <div style={styles.page}>
      <div style={styles.overlay}>
        
        {/* HEADER & DASHBOARD */}
        <header style={styles.header}>
          <h1 style={{fontSize: '3rem', textShadow: '2px 2px 10px black', margin: 0}}>{infoFazenda.nome || "Fazenda Vale Araujo"}</h1>
          <p style={{textShadow: '1px 1px 5px black', fontSize: '1.2rem'}}>📍 {infoFazenda.localizacao}</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', maxWidth: '800px', margin: '25px auto' }}>
            <div style={{...styles.card, background: 'rgba(255,255,255,0.9)'}}><b>Rebanho</b><br/>{gados.length} Cabeças</div>
            <div style={{...styles.card, background: 'rgba(255,255,255,0.9)'}}><b>Peso Total</b><br/>{pesoTotal.toLocaleString()} kg</div>
            <div style={{...styles.card, background: 'rgba(255,255,255,0.9)', color: '#27ae60'}}><b>Patrimônio</b><br/>R$ {valorTotal.toLocaleString()}</div>
          </div>

          <div style={{display: 'flex', justifyContent: 'center', gap: '15px'}}>
            <button onClick={() => { setFormData({brinco:'', nome:'', nascimento:'', dados_extras:modeloExtras}); setView('formulario'); }} style={styles.btnVerde}>+ Novo Animal</button>
            <button onClick={() => setView('config')} style={{...styles.btnVerde, background: '#2c3e50'}}>⚙️ Perfil da Fazenda</button>
          </div>
        </header>

        {/* VIEW: GRADE DE ANIMAIS */}
        {view === 'grid' && (
          <div style={styles.gridContainer}>
            {gados.map(g => (
              <div key={g.id} style={{...styles.card, padding: 0, cursor: 'pointer', overflow: 'hidden'}} onClick={() => { setSelecionado(g); setView('detalhes'); }}>
                <img src={g.foto_url || 'https://via.placeholder.com/200?text=Sem+Foto'} style={{width: '100%', height: '180px', objectFit: 'cover'}} />
                <div style={{padding: '15px', textAlign: 'center'}}>
                  <b style={{fontSize: '1.1rem'}}>{g.nome || "S/N"}</b><br/>
                  <small style={{color: '#7f8c8d'}}>Brinco: {g.brinco}</small>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VIEW: DETALHES DO ANIMAL */}
        {view === 'detalhes' && selecionado && (
          <div style={{...styles.card, maxWidth: '600px', margin: 'auto'}}>
            <button onClick={() => setView('grid')} style={{position: 'absolute', right: '15px', top: '15px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer'}}>✖</button>
            <img src={selecionado.foto_url || 'https://via.placeholder.com/400'} style={{width: '100%', borderRadius: '10px', maxHeight: '350px', objectFit: 'cover'}} />
            <h2 style={{margin: '15px 0 5px 0'}}>{selecionado.nome} <small style={{fontWeight: 'normal', color: '#888'}}>#{selecionado.brinco}</small></h2>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', borderTop: '1px solid #eee', paddingTop: '15px'}}>
              <p><b>Peso:</b> {selecionado.dados_extras?.peso || 0} kg</p>
              <p><b>Gênero:</b> {selecionado.dados_extras?.genero || 'Macho'}</p>
              <p><b>Nascimento:</b> {selecionado.nascimento}</p>
              <p><b>Vacina:</b> {selecionado.dados_extras?.ultima_vacina || 'Pendente'}</p>
            </div>
            <h3 style={{color: '#27ae60', textAlign: 'center', background: '#f4fbf7', padding: '10px', borderRadius: '10px'}}>Valor Estimado: R$ {selecionado.dados_extras?.preco_total || 0}</h3>
            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
              <button onClick={() => prepararEdicao(selecionado)} style={{flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer'}}>Editar Dados</button>
              <button onClick={() => { if(confirm("Remover animal?")) fetch(`${API_BASE}/gados/${selecionado.id}`, {method:'DELETE'}).then(() => {setView('grid'); carregarDados();}) }} style={{flex: 1, padding: '10px', borderRadius: '8px', color: 'red', cursor: 'pointer'}}>Excluir</button>
            </div>
          </div>
        )}

        {/* VIEW: FORMULÁRIO DO GADO */}
        {view === 'formulario' && (
          <div style={{...styles.card, maxWidth: '500px', margin: 'auto'}}>
            <h2 style={{marginTop: 0}}>{formData.id ? '📝 Editar Animal' : '➕ Novo Cadastro'}</h2>
            <form onSubmit={handleSubmitGado}>
              <div style={{display: 'flex', gap: '10px'}}>
                <input style={styles.input} placeholder="Brinco" value={formData.brinco} onChange={e => setFormData({...formData, brinco: e.target.value})} required />
                <input style={styles.input} placeholder="Nome" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              </div>
              <input style={styles.input} type="date" value={formData.nascimento} onChange={e => setFormData({...formData, nascimento: e.target.value})} required />
              <div style={{display: 'flex', gap: '10px'}}>
                <input style={styles.input} type="number" placeholder="Peso" value={formData.dados_extras.peso} onChange={e => handleExtraChange('peso', e.target.value)} />
                <input style={styles.input} type="number" step="0.01" placeholder="R$/kg" value={formData.dados_extras.preco_kg} onChange={e => handleExtraChange('preco_kg', e.target.value)} />
              </div>
              <div style={{...styles.input, background: '#f8f9fa', fontWeight: 'bold', textAlign: 'center'}}>Total: R$ {formData.dados_extras.preco_total}</div>
              <label>Foto:</label>
              <input type="file" onChange={e => setFotoGado(e.target.files[0])} style={{marginBottom: '20px', display: 'block'}} />
              <button type="submit" style={{...styles.btnVerde, width: '100%', borderRadius: '8px'}}>Salvar Animal</button>
              <button type="button" onClick={() => setView('grid')} style={{width: '100%', marginTop: '10px', background: 'none', border: 'none', cursor: 'pointer'}}>Cancelar</button>
            </form>
          </div>
        )}

        {/* VIEW: CONFIGURAÇÕES DA FAZENDA */}
        {view === 'config' && (
          <div style={{...styles.card, maxWidth: '500px', margin: 'auto'}}>
            <h2 style={{marginTop: 0}}>🏠 Perfil da Fazenda</h2>
            <form onSubmit={handleSalvarFazenda}>
              <label>Nome da Propriedade:</label>
              <input style={styles.input} value={infoFazenda.nome} onChange={e => setInfoFazenda({...infoFazenda, nome: e.target.value})} required />
              <label>Município/Estado:</label>
              <input style={styles.input} value={infoFazenda.localizacao} onChange={e => setInfoFazenda({...infoFazenda, localizacao: e.target.value})} required />
              <label>Área (Hectares):</label>
              <input style={styles.input} type="number" value={infoFazenda.area_hectares} onChange={e => setInfoFazenda({...infoFazenda, area_hectares: e.target.value})} />
              <label>Foto de Fundo (Fazenda):</label>
              <input type="file" onChange={e => setFotoFazenda(e.target.files[0])} style={{marginBottom: '20px', display: 'block'}} />
              <button type="submit" style={{...styles.btnVerde, width: '100%', borderRadius: '8px', background: '#2c3e50'}}>Salvar Perfil</button>
              <button type="button" onClick={() => setView('grid')} style={{width: '100%', marginTop: '10px', background: 'none', border: 'none', cursor: 'pointer'}}>Voltar</button>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}

export default App
