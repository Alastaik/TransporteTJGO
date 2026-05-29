# 🚀 Guia de Deploy — Transporte TJGO (Oracle Cloud Free Tier)

Este guia explica como fazer o deploy completo do sistema **Transporte TJGO** em uma Máquina Virtual (VM) da Oracle Cloud Infrastructure (OCI).

---

## 1. Pré-requisitos na VM

Acesse sua VM Oracle via SSH:
```bash
ssh -i sua_chave.pem ubuntu@ip_da_sua_vm
```

Atualize o sistema e instale os pacotes básicos:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git postgresql postgresql-contrib nginx
```

Instale o Node.js (v18 ou superior):
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 2. Configuração do Banco de Dados (PostgreSQL)

Entre no console do PostgreSQL:
```bash
sudo -u postgres psql
```

Execute os comandos abaixo para criar o usuário e o banco de dados:
```sql
CREATE DATABASE transporte_tjgo;
CREATE USER tjgo_app WITH ENCRYPTED PASSWORD 'senha_forte_aqui';
GRANT ALL PRIVILEGES ON DATABASE transporte_tjgo TO tjgo_app;
\c transporte_tjgo
GRANT ALL ON SCHEMA public TO tjgo_app;
\q
```

---

## 3. Clone e Configuração do Projeto

Clone o repositório na pasta `/var/www/`:
```bash
sudo mkdir -p /var/www/transporte
sudo chown -R $USER:$USER /var/www/transporte
cd /var/www/transporte
git clone https://seu_repositorio.git .
```

Instale as dependências:
```bash
npm install
```

Configure as variáveis de ambiente:
```bash
cp .env.example .env
nano .env
```
_Altere a `DB_PASSWORD` para a senha que você configurou no passo 2 e mude a `JWT_SECRET` para algo seguro._

---

## 4. Estrutura do Banco e Seed de Dados

Agora rode os scripts para montar a estrutura das tabelas e inserir os vistoriadores padrões:

```bash
npm run db:setup
npm run db:seed
```
_Os usuários iniciais serão criados com o PIN padrão `1234`._

---

## 5. Mantendo a API Rodando (PM2)

Para garantir que o backend inicie junto com a VM e caso dê erro ele reinicie, use o **PM2**:

```bash
sudo npm install -g pm2
pm2 start server/server.js --name "tjgo-api"
pm2 startup
# Rode o comando que o PM2 irá gerar na tela (ex: sudo env PATH...)
pm2 save
```

---

## 6. Configurando o Nginx (Proxy Reverso)

O Nginx vai receber o tráfego da porta 80 e enviar para o backend na porta 3000.

Crie o arquivo de configuração:
```bash
sudo nano /etc/nginx/sites-available/transporte
```

Cole o conteúdo abaixo:
```nginx
server {
    listen 80;
    server_name seu_dominio.com ou_ip_da_vm;

    # Aumentar tamanho máximo de upload (para PDFs e fotos)
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ative o site e reinicie o Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/transporte /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 7. Liberando as Portas na Oracle Cloud

Para o sistema ficar acessível na internet:
1. Vá no painel da Oracle Cloud (OCI).
2. Vá em **Networking -> Virtual Cloud Networks**.
3. Clique na sua VCN -> **Security Lists** -> **Default Security List**.
4. Adicione uma Regra de Entrada (Ingress Rule):
   - **Source CIDR**: `0.0.0.0/0`
   - **Destination Port Range**: `80, 443`
   - **Protocol**: TCP

Também libere o firewall dentro da VM (Ubuntu iptables):
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

---

## ✅ Pronto!
Seu sistema já deve estar acessível pelo IP da máquina. Acesse pelo navegador em dispositivos móveis, e a opção **"Adicionar à Tela Inicial"** aparecerá devido à configuração PWA.
