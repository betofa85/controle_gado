import os
import shutil
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date

# Importando seus arquivos locais
import models, database

# Cria as tabelas no banco de dados se elas ainda não existirem
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Fazenda do Vale Araujo API")

# Configuração de CORS para permitir que o Frontend acesse a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuração da pasta de uploads de fotos
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# Monta a pasta de uploads para ser acessível via URL
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- MODELOS DE DADOS (SCHEMAS) ---

class GadoCreate(BaseModel):
    brinco: str
    nome: Optional[str] = ""
    nascimento: date
    dados_extras: Optional[dict] = {}

class FazendaUpdate(BaseModel):
    nome: str
    localizacao: str
    area_hectares: Optional[float] = 0.0

# --- ROTAS DA FAZENDA ---

@app.get("/fazenda/1")
def buscar_fazenda(db: Session = Depends(database.get_db)):
    fazenda = db.query(models.Fazenda).filter(models.Fazenda.id == 1).first()
    if not fazenda:
        fazenda = models.Fazenda(id=1, nome="Fazenda do Vale Araujo", localizacao="Maranhão")
        db.add(fazenda)
        db.commit()
        db.refresh(fazenda)
    return fazenda

@app.put("/fazenda/1")
def atualizar_fazenda(dados: FazendaUpdate, db: Session = Depends(database.get_db)):
    fazenda = db.query(models.Fazenda).filter(models.Fazenda.id == 1).first()
    if not fazenda:
        raise HTTPException(status_code=404, detail="Fazenda não encontrada")
    fazenda.nome = dados.nome
    fazenda.localizacao = dados.localizacao
    fazenda.area_hectares = dados.area_hectares
    db.commit()
    db.refresh(fazenda)
    return fazenda

@app.post("/fazenda/1/upload-foto")
async def upload_foto_fazenda(file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    # Define um nome fixo ou único para a foto da fazenda
    file_path = f"{UPLOAD_DIR}/perfil_fazenda_{file.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    fazenda = db.query(models.Fazenda).filter(models.Fazenda.id == 1).first()
    # Atualiza a URL no banco
    fazenda.foto_url = f"http://192.168.68.120:8000/{file_path}"
    
    db.commit()
    db.refresh(fazenda)
    return {"url": fazenda.foto_url}

# --- ROTAS DO GADO (CRUD) ---

@app.get("/gados/")
def listar_gados(db: Session = Depends(database.get_db)):
    return db.query(models.Gado).all()

@app.post("/gados/")
def criar_gado(gado: GadoCreate, db: Session = Depends(database.get_db)):
    db_gado = models.Gado(**gado.dict(), fazenda_id=1)
    db.add(db_gado)
    db.commit()
    db.refresh(db_gado)
    return db_gado

@app.put("/gados/{gado_id}")
def editar_gado(gado_id: int, gado_update: GadoCreate, db: Session = Depends(database.get_db)):
    db_gado = db.query(models.Gado).filter(models.Gado.id == gado_id).first()
    if not db_gado:
        raise HTTPException(status_code=404, detail="Gado não encontrado")
    
    # Atualiza os campos básicos
    dados = gado_update.dict()
    for key, value in dados.items():
        setattr(db_gado, key, value)
    
    db.commit()
    db.refresh(db_gado)
    return db_gado

@app.delete("/gados/{gado_id}")
def remover_gado(gado_id: int, db: Session = Depends(database.get_db)):
    db_gado = db.query(models.Gado).filter(models.Gado.id == gado_id).first()
    if not db_gado:
        raise HTTPException(status_code=404, detail="Gado não encontrado")
    
    # Remove a foto do disco se ela existir
    if db_gado.foto_url:
        try:
            # Extrai o caminho relativo (ex: uploads/foto.jpg)
            path = db_gado.foto_url.split("8000/")[1]
            if os.path.exists(path):
                os.remove(path)
        except Exception as e:
            print(f"Erro ao deletar arquivo: {e}")

    db.delete(db_gado)
    db.commit()
    return {"status": "removido com sucesso"}

@app.post("/gados/{gado_id}/upload-foto")
async def upload_foto(gado_id: int, file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    # Garante um nome de arquivo único
    file_path = f"{UPLOAD_DIR}/{gado_id}_{file.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    db_gado = db.query(models.Gado).filter(models.Gado.id == gado_id).first()
    # Atualiza a URL da foto (ajuste o IP se necessário)
    db_gado.foto_url = f"http://192.168.68.120:8000/{file_path}"
    
    db.commit()
    db.refresh(db_gado)
    return {"url": db_gado.foto_url}
