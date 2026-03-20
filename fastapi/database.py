from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Altere para os dados que você definiu no seu Docker
SQLALCHEMY_DATABASE_URL = "postgresql://admin:SenhaForte@db:5432/controle_gado"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
