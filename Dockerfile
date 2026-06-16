# STAGE 1: Build environment
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copia arquivos de dependência
COPY package*.json ./

# Instala TODAS dependências (incluindo dev para build)
RUN npm ci

# Copia o código-fonte
COPY . .

# Compila o backend e o frontend
RUN npm run build

# STAGE 2: Production environment
FROM node:20-alpine AS production

WORKDIR /usr/src/app

# Define ambiente como produção
ENV NODE_ENV=production

# Instala o client do PostgreSQL para rotina de backup (pg_dump)
RUN apk update && apk add postgresql-client && rm -rf /var/cache/apk/*

# Copia arquivos de dependência
COPY package*.json ./

# Instala apenas dependências de produção
RUN npm ci --only=production

# Copia arquivos buildados e assets
COPY --from=builder /usr/src/app/dist/client ./dist/client
COPY --from=builder /usr/src/app/dist/server ./dist/server
COPY --from=builder /usr/src/app/server/db/schema.sql ./dist/server/db/schema.sql


# Cria a pasta de storage e dá permissões
RUN mkdir -p ./server/storage/pdfs && chown -R node:node ./server/storage/pdfs \
    && mkdir -p ./server/storage/fotos && chown -R node:node ./server/storage/fotos \
    && mkdir -p ./server/storage/backups && chown -R node:node ./server/storage/backups

# Muda para usuário não-root (boa prática de segurança)
USER node

# Expondo a porta
EXPOSE 3000

# Script para rodar o app compilado
CMD ["node", "dist/server/server.js"]
