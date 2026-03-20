from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from database import Base


# fastapi/models.py
from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from database import Base

class Fazenda(Base):
    __tablename__ = "fazendas"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    localizacao = Column(String)
    foto_url = Column(String)
    area_hectares = Column(Float)

class Gado(Base):
    __tablename__ = "gados"
    id = Column(Integer, primary_key=True, index=True)
    brinco = Column(String)
    nome = Column(String)
    nascimento = Column(Date)
    foto_url = Column(String)
    dados_extras = Column(JSONB)
    # Adicionando a chave estrangeira
    fazenda_id = Column(Integer, ForeignKey("fazendas.id"), default=1)

