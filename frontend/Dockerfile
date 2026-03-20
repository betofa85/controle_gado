FROM node:20

WORKDIR /app

# Instala as dependências primeiro (cache do Docker)
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Roda o Vite no modo host para o Docker conseguir mapear a porta
CMD ["npm", "run", "dev", "--", "--host"]
