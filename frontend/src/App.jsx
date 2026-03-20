import { useEffect, useState } from 'react'

const API_BASE = "http://192.168.68.120:8000"

function App() {
  const [gados, setGados] = useState([])
  const [editando, setEditando] = useState(null)
  const [foto, setFoto] = useState(null)
  
  // Estado inicial do formulário com os novos campos extras
  const [formData, setFormData] = useState({
    brinco: '',
    nome: '',
    nascimento: '',
    raca_id: 1,
    dados_extras: {
      peso: 0,
      genero: 'Macho',
      ultima_vacina: '',
      preco_kg: 0,
      preco_total: 0
    }
  })

  const carregarGados = () => {
    fetch(`${API_BASE}/gados/`)
      .then(res => res.json())
      .then(data => setGados(data))
      .catch(err => console.error("Erro ao carregar:", err))
  }

  useEffect(() => carregarGados(), [])

  // Função para lidar com mudanças nos campos do JSONB e calcular o preço
  const handleExtraChange = (campo, valor) => {
    const novosDadosExtras = { ...formData.dados_extras, [campo]: valor }
    
    // Cálculo automático: Preço Total = Peso * Preço por kg
    if (campo === 'peso' || campo === 'preco_kg') {
      const p = campo === 'peso' ? parseFloat(valor || 0) : parseFloat(formData.dados_extras.peso || 0)
      const v = campo === 'preco_kg' ? parseFloat(valor || 0) : parseFloat(formData.dados_extras.preco_kg || 0)
      novosDadosExtras.preco_total = (p * v).toFixed(2)
    }

    setFormData({ ...formData, dados_extras: novosDadosExtras })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const method = editando ? 'PUT' : 'POST'
    const url = editando ? `${API_BASE}/gados/${editando.id}` : `${API_BASE}/gados/`

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
        await fetch(`${API_BASE}/gados/${gadoSalvo.id}/upload-foto`, {
          method: 'POST',
          body: formFoto
        })
      }

      setEditando(null)
      setFormData({ 
        brinco: '', nome: '', nascimento: '', raca_id: 1, 
        dados_extras: { peso: 0, genero: 'Macho', ultima_vacina: '', preco_kg: 0, preco_total: 0 } 
      })
      setFoto(null)
      carregarGados()
    } catch (err) {
      alert("Erro ao salvar registro")
    }
  }

  const deletarGado = async (id) => {
    if (window.confirm("Deseja remover este animal?")) {
      await fetch(`${API_BASE}/gados/${id}`, { method: 'DELETE' })
      carregarGados()
    }
  }

  // Cálculos para o Dashboard
  const totalAnimais = gados.length
  const pesoTotal = gados.reduce((acc, g) => acc + parseFloat(g.dados_extras?.peso || 0), 0)
  const valorPatrimonio = gados.reduce((acc, g) => acc + parseFloat(g.dados_extras?.preco_total || 0), 0)

  // ESTILOS
  const styles = {
    container: {
      backgroundImage: 'url(/fazenda.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      fontFamily: 'Segoe UI, Roboto, sans-serif',
      padding: '20px'
    },
    overlay: {
      maxWidth: '900px',
      margin: 'auto',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      padding: '30px',
      borderRadius: '20px',
      backdropFilter: 'blur(5px)'
    },
    dashboard: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '15px',
      marginBottom: '30px'
    },
    statCard: {
      background: 'rgba(255, 255, 255, 0.9)',
      padding: '15px',
      borderRadius: '10px',
      textAlign: 'center',
      color: '#333'
    },
    form: {
      background: 'white',
      padding: '25px',
      borderRadius: '15px',
      marginBottom: '30px',
      color: '#333',
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
    },
    input: {
      width: '100%',
      padding: '10px',
      marginBottom: '10px',
      borderRadius: '5px',
      border: '1px solid #ccc',
      boxSizing: 'border-box'
    },
    card: {
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '15px',
      borderRadius: '12px',
      marginBottom: '15px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      color: '#333'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.overlay}>
        <h1 style={{ textAlign: 'center', color: 'white', fontSize: '2.5em', textShadow: '2px 2px 4px #000' }}>
          Fazenda do Vale Araujo
        </h1>

        {/* DASHBOARD */}
        <div style={styles.dashboard}>
          <div style={styles.statCard}>
            <h3>Total Gado</h3>
            <p style={{fontSize: '1.5em', fontWeight: 'bold'}}>{totalAnimais}</p>
          </div>
          <div style={styles.statCard}>
            <h3>Peso Total</h3>
            <p style={{fontSize: '1.5em', fontWeight: 'bold'}}>{pesoTotal.toLocaleString()} kg</p>
          </div>
          <div style={styles.statCard}>
            <h3>Patrimônio Est.</h3>
            <p style={{fontSize: '1.5em', fontWeight: 'bold', color: 'green'}}>R$ {valorPatrimonio.toLocaleString()}</p>
          </div>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={{marginTop: 0}}>{editando ? '📝 Editar Registro' : '➕ Novo Cadastro'}</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input style={styles.input} type="text" placeholder="Brinco (ID Visual)" value={formData.brinco} onChange={e => setFormData({...formData, brinco: e.target.value})} required />
            <input style={styles.input} type="text" placeholder="Nome do Animal" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label>Nascimento:</label>
              <input style={styles.input} type="date" value={formData.nascimento} onChange={e => setFormData({...formData, nascimento: e.target.value})} required />
            </div>
            <div>
              <label>Gênero:</label>
              <select style={styles.input} value={formData.dados_extras.genero} onChange={e => handleExtraChange('genero', e.target.value)}>
                <option value="Macho">Macho</option>
                <option value="Fêmea">Fêmea</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <input style={styles.input} type="number" placeholder="Peso (kg)" value={formData.dados_extras.peso} onChange={e => handleExtraChange('peso', e.target.value)} />
            <input style={styles.input} type="number" step="0.01" placeholder="Preço/kg (R$)" value={formData.dados_extras.preco_kg} onChange={e => handleExtraChange('preco_kg', e.target.value)} />
            <div style={{...styles.input, background: '#f8f9fa', fontWeight: 'bold', display: 'flex', alignItems: 'center'}}>
               R$ {formData.dados_extras.preco_total}
            </div>
          </div>

          <label>Última Vacinação:</label>
          <input style={styles.input} type="date" value={formData.dados_extras.ultima_vacina} onChange={e => handleExtraChange('ultima_vacina', e.target.value)} />

          <label>Foto do Animal:</label>
          <input type="file" onChange={e => setFoto(e.target.files[0])} style={{marginBottom: '15px', display: 'block'}} />

          <button type="submit" style={{ background: '#28a745', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            {editando ? 'Atualizar Animal' : 'Cadastrar Animal'}
          </button>
          {editando && <button onClick={() => { setEditando(null); setFormData({ brinco: '', nome: '', nascimento: '', raca_id: 1, dados_extras: { peso: 0, genero: 'Macho', ultima_vacina: '', preco_kg: 0, preco_total: 0 } }); }} style={{ marginLeft: '10px', padding: '12px 20px', cursor: 'pointer', borderRadius: '5px', border: '1px solid #ccc' }}>Cancelar</button>}
        </form>

        {/* LISTAGEM */}
        <div style={{ display: 'grid', gap: '15px' }}>
          {gados.map(gado => (
            <div key={gado.id} style={styles.card}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img 
                  src={gado.foto_url || 'https://via.placeholder.com/100?text=Sem+Foto'} 
                  alt="gado" 
                  style={{ width: '100px', height: '100px', borderRadius: '10px', objectFit: 'cover', marginRight: '20px', border: '2px solid #ddd' }} 
                />
                <div>
                  <h3 style={{margin: '0 0 5px 0'}}>{gado.nome || 'Sem Nome'} <span style={{color: '#666', fontSize: '0.8em'}}>#{gado.brinco}</span></h3>
                  <p style={{ margin: 0, fontSize: '0.9em' }}><strong>Peso:</strong> {gado.dados_extras?.peso} kg | <strong>Gênero:</strong> {gado.dados_extras?.genero}</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: 'green', fontWeight: 'bold' }}>Valor: R$ {gado.dados_extras?.preco_total}</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '0.8em', color: '#888' }}>Vacina: {gado.dados_extras?.ultima_vacina || 'Não informada'}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => { setEditando(gado); setFormData(gado); window.scrollTo(0,0); }} style={{ padding: '8px 15px', cursor: 'pointer', borderRadius: '5px', border: '1px solid #007bff', color: '#007bff', background: 'none' }}>Editar</button>
                <button onClick={() => deletarGado(gado.id)} style={{ padding: '8px 15px', cursor: 'pointer', borderRadius: '5px', border: '1px solid #dc3545', color: '#dc3545', background: 'none' }}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
