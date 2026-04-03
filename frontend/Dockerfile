# Estágio de Desenvolvimento
FROM node:22-alpine

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o resto do código
COPY . .

# Expõe a porta do Vite
EXPOSE 5173

# Comando para rodar em modo desenvolvimento com Hot Reload
CMD ["npm", "run", "dev", "--", "--host"]
