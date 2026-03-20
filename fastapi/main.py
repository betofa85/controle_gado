import os
import shutil # Para deletar o arquivo
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import models, database
from pydantic import BaseModel
from datetime import date
from typing import Optional
from fastapi import File, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware


# Garante que as tabelas existam
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Fazenda Vale Araujo API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Isso permite que qualquer máquina da sua rede acesse a API
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependência para pegar a sessão do banco
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Schema para validação (o que a API espera receber)
class GadoCreate(BaseModel):
    brinco: str
    nome: str
    nascimento: date
    dados_extras: Optional[dict] = None

@app.post("/gados/")
def criar_gado(gado: GadoCreate, db: Session = Depends(get_db)):
    db_gado = models.Gado(**gado.dict())
    db.add(db_gado)
    db.commit()
    db.refresh(db_gado)
    return db_gado

@app.get("/gados/")
def listar_gados(db: Session = Depends(get_db)):
    return db.query(models.Gado).all()


UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# Permite que o navegador acesse http://localhost:8000/uploads/foto.jpg
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.post("/gados/{gado_id}/upload-foto")
async def upload_foto(gado_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_path = f"{UPLOAD_DIR}/{gado_id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # Atualiza o banco com o caminho da foto
    db_gado = db.query(models.Gado).filter(models.Gado.id == gado_id).first()
    db_gado.foto_url = f"http://192.168.68.120:8000/{file_path}"
    db.commit()
    return {"info": "Foto salva com sucesso"}



@app.put("/gados/{gado_id}")
def editar_gado(gado_id: int, gado_update: GadoCreate, db: Session = Depends(get_db)):
    db_gado = db.query(models.Gado).filter(models.Gado.id == gado_id).first()
    if not db_gado:
        raise HTTPException(status_code=404, detail="Gado não encontrado")

    # Atualiza os campos
    for key, value in gado_update.dict().items():
        setattr(db_gado, key, value)

    db.commit()
    db.refresh(db_gado)
    return db_gado

@app.delete("/gados/{gado_id}")
def remover_gado(gado_id: int, db: Session = Depends(get_db)):
    db_gado = db.query(models.Gado).filter(models.Gado.id == gado_id).first()
    if not db_gado:
        raise HTTPException(status_code=404, detail="Gado não encontrado")

    # Opcional: Deletar o arquivo de imagem do servidor
    if db_gado.foto_url:
        # Extrai o caminho relativo do arquivo da URL
        file_path = db_gado.foto_url.split("http://192.168.68.120:8000/")[1]
        if os.path.exists(file_path):
            os.remove(file_path)

    db.delete(db_gado)
    db.commit()
    return {"detail": "Gado removido com sucesso"}
