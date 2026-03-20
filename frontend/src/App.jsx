import { useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const API_BASE = "http://192.168.68.120:8000"

function App() {
  // Estados de Dados
  const [gados, setGados] = useState([])
  const [infoFazenda, setInfoFazenda] = useState({ nome: '', localizacao: '', area_hectares: 0, foto_url: '' })
  
  // Estados de Navegação e Pesquisa
  const [view, setView] = useState('grid') 
  const [selecionado, setSelecionado] = useState(null)
  const [termoPesquisa, setTermoPesquisa] = useState('')
  
  // Estados de Arquivos
  const [fotoGado, setFotoGado] = useState(null)
  const [fotoFazenda, setFotoFazenda] = useState(null)

  const modeloExtras = { peso: 0, genero: 'Macho', ultima_vacina: '', preco_kg: 0, preco_total: 0 }
  const [formData, setFormData] = useState({ brinco: '', nome: '', nascimento: '', dados_extras: modeloExtras })

  // --- CARREGAMENTO ---
  const carregarDados = () => {
    fetch(`${API_BASE}/gados/`).then(res => res.json()).then(setGados)
    fetch(`${API_BASE}/fazenda/1`).then(res => res.json()).then(setInfoFazenda)
  }

  useEffect(() => carregarDados(), [])

  // --- LÓGICA DE FILTRAGEM (BUSCA) ---
  const gadosFiltrados = gados.filter(g => 
    g.brinco.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    (g.nome && g.nome.toLowerCase().includes(termoPesquisa.toLowerCase()))
  )

  // --- EXPORTAR PDF ---
  const exportarPDF = () => {
    const doc = new jsPDF()
    const dataAtual = new Date().toLocaleDateString('pt-BR')

    // Cabeçalho do Relatório
    doc.setFontSize(18)
    doc.text(infoFazenda.nome || "Relatório de Rebanho", 14, 20)
    doc.setFontSize(10)
    doc.text(`Localização: ${infoFazenda.localizacao} | Data: ${dataAtual}`, 14, 28)

    // Tabela de Dados
    const colunas = ["Brinco", "Nome", "Gênero", "Peso (kg)", "Preço/kg", "Total (R$)"]
    const linhas = gadosFiltrados.map(g => [
      g.brinco,
      g.nome || '---',
      g.dados_extras?.genero || 'Macho',
      g.dados_extras?.peso || 0,
      `R$ ${g.dados_extras?.preco_kg || 0}`,
      `R$ ${g.dados_extras?.preco_total || 0}`
    ])

    doc.autoTable({
      startY: 35,
      head: [colunas],
      body: linhas,
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80] } // Azul escuro profissional
    })

    // Rodapé com Totais
    const finalY = doc.lastAutoTable.finalY + 10
    const valorTotal = gadosFiltrados.reduce((acc, g) => acc + parseFloat(g.dados_extras?.preco_total || 0), 0)
    doc.setFontSize(12)
    doc.text(`Total de Cabeças no Relatório: ${gadosFiltrados.length}`, 14, finalY)
    doc.text(`Valor Patrimonial Filtrado: R$ ${valorTotal.toLocaleString()}`, 14, finalY + 7)

    doc.save(`relatorio_${infoFazenda.nome.replace(/\s+/g, '_').toLowerCase()}.pdf`)
  }

  // --- RESTANTE DA LÓGICA (CRUD) ---
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
    if (fotoGado && salvo.id) {
      const fd = new FormData(); fd.append('file', fotoGado)
      await fetch(`${API_BASE}/gados/${salvo.id}/upload-foto`, { method: 'POST', body: fd })
    }
    setFotoGado(null); setView('grid'); setTermoPesquisa(''); carregarDados()
  }

  const handleSalvarFazenda = async (e) => {
    e.preventDefault()
    await fetch(`${API_BASE}/fazenda/1`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(infoFazenda) })
    if (fotoFazenda) {
      const fd = new FormData(); fd.append('file', fotoFazenda)
      await fetch(`${API_BASE}/fazenda/1/upload-foto`, { method: 'POST', body: fd })
    }
    setFotoFazenda(null); setView('grid'); carregarDados()
  }

  const styles = {
    page: { backgroundImage: `url("${infoFazenda.foto_url || '/fazenda.jpg'}")`, backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: 'white' },
    overlay: { backgroundColor: 'rgba(0,0,0,0.5)', minHeight: '100vh', padding: '20px', backdropFilter: 'blur(3px)' },
    card: { background: 'white', borderRadius: '15px', padding: '20px', color: '#333', boxShadow: '0 8px 20px rgba(0,0,0,0.4)', position: 'relative' },
    input: { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' },
    searchBar: { padding: '12px 20px', width: '300px', borderRadius: '25px', border: 'none', marginRight: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }
  }

  return (
    <div style={styles.page}>
      <div style={styles.overlay}>
        
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{fontSize: '3rem', textShadow: '2px 2px 10px black', margin: 0}}>{infoFazenda.nome || "Vale Araujo"}</h1>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', maxWidth: '800px', margin: '25px auto' }}>
            <div style={{...styles.card, background: 'rgba(255,255,255,0.9)'}}><b>Rebanho Total</b><br/>{gados.length} Cabeças</div>
            <div style={{...styles.card, background: 'rgba(255,255,255,0.9)'}}><b>Filtrados</b><br/>{gadosFiltrados.length} Animais</div>
            <div style={{...styles.card, background: 'rgba(255,255,255,0.9)', color: '#27ae60'}}><b>Valor Filtrado</b><br/>R$ {gadosFiltrados.reduce((acc, g) => acc + parseFloat(g.dados_extras?.preco_total || 0), 0).toLocaleString()}</div>
          </div>

          {/* BARRA DE BUSCA E BOTÕES */}
          <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', flexWrap: 'wrap'}}>
            <input 
              style={styles.searchBar} 
              type="text" 
              placeholder="🔍 Buscar brinco ou nome..." 
              value={termoPesquisa}
              onChange={(e) => setTermoPesquisa(e.target.value)}
            />
            <button onClick={() => { setFormData({brinco:'', nome:'', nascimento:'', dados_extras:modeloExtras}); setView('formulario'); }} style={{background: '#27ae60', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold'}}>+ Novo Animal</button>
            <button onClick={exportarPDF} style={{background: '#e67e22', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold'}}>📥 Exportar PDF</button>
            <button onClick={() => setView('config')} style={{background: '#2c3e50', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '25px', cursor: 'pointer'}}>⚙️ Perfil</button>
          </div>
        </header>

        {/* VIEW: GRID (Sempre usa gadosFiltrados agora) */}
        {view === 'grid' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '25px', maxWidth: '1100px', margin: 'auto' }}>
            {gadosFiltrados.map(g => (
              <div key={g.id} style={{...styles.card, padding: 0, cursor: 'pointer', overflow: 'hidden'}} onClick={() => { setSelecionado(g); setView('detalhes'); }}>
                <img src={g.foto_url || 'https://via.placeholder.com/200?text=Sem+Foto'} style={{width: '100%', height: '180px', objectFit: 'cover'}} />
                <div style={{padding: '15px', textAlign: 'center'}}>
                  <b>{g.nome || "S/N"}</b><br/><small>#{g.brinco}</small>
                </div>
              </div>
            ))}
            {gadosFiltrados.length === 0 && <p style={{textAlign: 'center', gridColumn: '1/-1'}}>Nenhum animal encontrado com esse termo.</p>}
          </div>
        )}

        {/* DETALHES, FORMULÁRIO E CONFIG (CÓDIGO ANTERIOR MANTIDO ABAIXO) */}
        {view === 'detalhes' && selecionado && (
          <div style={{...styles.card, maxWidth: '600px', margin: 'auto'}}>
            <button onClick={() => setView('grid')} style={{position: 'absolute', right: '15px', top: '15px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer'}}>✖</button>
            <img src={selecionado.foto_url || 'https://via.placeholder.com/400'} style={{width: '100%', borderRadius: '10px', maxHeight: '350px', objectFit: 'cover'}} />
            <h2>{selecionado.nome} <small>#{selecionado.brinco}</small></h2>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', borderTop: '1px solid #eee', paddingTop: '15px'}}>
              <p><b>Peso:</b> {selecionado.dados_extras?.peso || 0} kg</p>
              <p><b>Gênero:</b> {selecionado.dados_extras?.genero || 'Macho'}</p>
              <p><b>Nascimento:</b> {selecionado.nascimento}</p>
              <p><b>Vacina:</b> {selecionado.dados_extras?.ultima_vacina || 'Pendente'}</p>
            </div>
            <h3 style={{color: '#27ae60', textAlign: 'center', background: '#f4fbf7', padding: '10px', borderRadius: '10px'}}>Valor Estimado: R$ {selecionado.dados_extras?.preco_total || 0}</h3>
            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
              <button onClick={() => { setFormData({...selecionado, dados_extras: {...modeloExtras, ...selecionado.dados_extras}}); setView('formulario'); }} style={{flex: 1, padding: '10px'}}>Editar</button>
              <button onClick={() => { if(confirm("Excluir?")) fetch(`${API_BASE}/gados/${selecionado.id}`, {method:'DELETE'}).then(() => {setView('grid'); carregarDados();}) }} style={{flex: 1, padding: '10px', color: 'red'}}>Excluir</button>
            </div>
          </div>
        )}

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
              <input type="file" onChange={e => setFotoGado(e.target.files[0])} />
              <button type="submit" style={{width: '100%', padding: '10px', background: '#27ae60', color: 'white', border: 'none', marginTop: '10px'}}>Salvar</button>
              <button type="button" onClick={() => setView('grid')} style={{width: '100%', marginTop: '5px'}}>Cancelar</button>
            </form>
          </div>
        )}

        {view === 'config' && (
          <div style={{...styles.card, maxWidth: '500px', margin: 'auto'}}>
            <h3>🏠 Perfil da Fazenda</h3>
            <form onSubmit={handleSalvarFazenda}>
              <label>Nome:</label>
              <input style={styles.input} value={infoFazenda.nome} onChange={e => setInfoFazenda({...infoFazenda, nome: e.target.value})} required />
              <label>Município/Estado:</label>
              <input style={styles.input} value={infoFazenda.localizacao} onChange={e => setInfoFazenda({...infoFazenda, localizacao: e.target.value})} required />
              <label>Área (ha):</label>
              <input style={styles.input} type="number" value={infoFazenda.area_hectares} onChange={e => setInfoFazenda({...infoFazenda, area_hectares: e.target.value})} />
              <label>Foto de Fundo:</label>
              <input type="file" onChange={e => setFotoFazenda(e.target.files[0])} style={{marginBottom: '20px', display: 'block'}} />
              <button type="submit" style={{width: '100%', padding: '10px', background: '#2c3e50', color: 'white', border: 'none'}}>Salvar Perfil</button>
              <button type="button" onClick={() => setView('grid')} style={{width: '100%', marginTop: '5px', background: 'none', border: 'none', cursor: 'pointer'}}>Voltar</button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
