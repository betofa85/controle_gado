from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from database import Base

class Gado(Base):
    __tablename__ = "gados"
    id = Column(Integer, primary_key=True, index=True)
    brinco = Column(String)
    nome = Column(String)
    raca_id = Column(Integer) # Simplificado para o teste inicial
    nascimento = Column(Date)
    dados_extras = Column(JSONB) # Aqui entra seu campo de comentários/json
    foto_url = Column(String, nullable=True)
