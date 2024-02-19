#!/bin/bash

# Defina o caminho do seu repositório local
caminho_repositorio="/home/cdn.viniciusdev.com.br/wabot"

# Navegue até o diretório do repositório
cd $caminho_repositorio

# Verifique se há alterações no repositório remoto
alteracoes=$(git fetch origin main)

if [ "$alteracoes" != "Already up to date." ]; then
    # Se houver alterações, faça git pull para atualizar
    git pull origin main
    echo "Repositório atualizado com sucesso!"

    # Instale as dependências com npm install
    npm install

    # Deleta somente o chat server do PM2
    pm2 delete "BOT SERVER"

    pm2 start --name "BOT SERVER" index.js
    pm2 save

    # O comando npm start não é necessário se você já está usando pm2 para gerenciar os processos
    # npm start
else
    echo "Nenhuma alteração no repositório."
fi
