# 🚀 Guia de Deploy — Transporte TJGO (Docker)

Este guia explica como fazer o deploy completo do sistema **Transporte TJGO** em produção (como em uma VM da Oracle Cloud) utilizando o Docker e Docker Compose.

---

## 1. Pré-requisitos na VM

Acesse sua VM via SSH e certifique-se de que o Git, o Docker e o Docker Compose estejam instalados:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git docker.io docker-compose
```

Adicione o usuário atual ao grupo docker para executar sem `sudo`:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

---

## 2. Clone do Projeto

Clone o repositório no seu diretório de preferência (ex: `/var/www/transporte` ou na sua pasta home):
```bash
git clone https://seu_repositorio.git transporte-tjgo
cd transporte-tjgo
```

---

## 3. Configuração de Variáveis de Ambiente

Configure as variáveis de ambiente necessárias copiando o arquivo de exemplo:
```bash
cp .env.example .env
nano .env
```
_Certifique-se de definir um `JWT_SECRET` forte e longo, além de conferir os dados de banco (`DB_PASSWORD`)._

---

## 4. Deploy com Docker Compose

O projeto inteiro foi containerizado (Frontend, Backend NodeJS, banco PostgreSQL). 

Para construir a imagem otimizada para produção e iniciar os containers em background, rode:

```bash
docker-compose build app
docker-compose up -d
```

Você pode acompanhar os logs com:
```bash
docker-compose logs -f app
```

### Inicializando o Banco de Dados

Se for a **primeira vez** rodando o sistema, você precisará criar as tabelas e o usuário administrador (`admin`, senha: `28072006`).
Execute o seguinte script dentro do container do banco de dados (certifique-se de aguardar alguns segundos para o banco iniciar):

```bash
docker exec -i tjgo_postgres psql -U tjgo_app -d transportetjgo_db < server/db/schema.sql
docker exec -i tjgo_postgres psql -U tjgo_app -d transportetjgo_db < create_admin.sql
```

---

## 5. Configurando Domínio Grátis (DuckDNS) e HTTPS (Nginx + Certbot)

Para que o sistema seja acessível por um link amigável e seguro (PWA exige HTTPS), você pode utilizar o **DuckDNS**.

### 5.1. Criar o Domínio no DuckDNS
1. Acesse [duckdns.org](https://www.duckdns.org/) e faça login.
2. Crie um subdomínio (ex: `tjgo-transporte`).
3. Aponte o IP (Current IP) para o **IP Público da sua Máquina Virtual (VM)** da Oracle Cloud.

### 5.2. Instalar o Nginx e Certbot
Na sua VM, instale o Nginx (proxy reverso) e o Certbot (para gerar o certificado SSL):
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 5.3. Configurar o Nginx
Crie um arquivo de configuração para o seu site:
```bash
sudo nano /etc/nginx/sites-available/tjgo-transporte
```

Cole o conteúdo abaixo (troque `SEU_DOMINIO.duckdns.org` pelo seu domínio real):
```nginx
server {
    listen 80;
    server_name SEU_DOMINIO.duckdns.org;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ative a configuração e reinicie o Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/tjgo-transporte /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5.4. Liberar Portas (Firewall)
Certifique-se de que as portas `80` (HTTP) e `443` (HTTPS) estão abertas na **Oracle Cloud (Ingress Rules)** e no firewall interno do Ubuntu:
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

### 5.5. Gerar o Certificado SSL
Rode o comando abaixo para que o Certbot aplique o HTTPS automaticamente na sua configuração do Nginx:
```bash
sudo certbot --nginx -d SEU_DOMINIO.duckdns.org
```
_Responda às perguntas na tela e escolha a opção para redirecionar todo o tráfego HTTP para HTTPS se for perguntado._

---

## ✅ Pronto!
O sistema está acessível na porta 3000 ou através do seu domínio. O layout é responsivo, funciona offline de forma nativa e pode ser "Adicionado à Tela Inicial" nos dispositivos móveis (PWA).
