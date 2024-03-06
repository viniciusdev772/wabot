const venom = require("venom-bot");
const axios = require("axios");
const FormData = require("form-data");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const userTempData = new Map();

venom
  .create({
    session: "session-name", // Nome da sessão
  })
  .then((client) => start(client))
  .catch((error) => {
    console.log(error);
  });

async function start(client) {
  client.onMessage(async (message) => {
    const from = message.from;
    if (!message.isGroupMsg) {
      const isUserLoggedIn = await verificarLogin(from);

      if (userTempData.has(from)) {
        const userData = userTempData.get(from);

        switch (userData.step) {
          case "escolherArquivo":
            if (isUserLoggedIn) {
              processarEscolhaArquivo(from, message.body, client);
            } else {
              client.sendText(
                from,
                "Você precisa estar conectado para escolher um arquivo. Use o comando 'conectar' para fazer login."
              );
            }
            break;
          case "confirmarApagar":
            if (isUserLoggedIn) {
              if (message.body.toLowerCase() === "apagar") {
                apagarArquivo(userData.arquivoEscolhido, from, client);
                userTempData.delete(from);
              } else {
                client.sendText(
                  from,
                  "Ação cancelada. Selecione um arquivo novamente ou use outro comando."
                );
                userTempData.delete(from);
              }
            } else {
              client.sendText(
                from,
                "Você precisa estar conectado para confirmar a exclusão. Use o comando 'conectar' para fazer login."
              );
              userTempData.delete(from);
            }
            break;
          default:
            client.sendText(
              from,
              "Não entendi sua resposta. Por favor, tente novamente."
            );
            break;
        }
      } else {
        processNonLoginCommands(message, client);
      }
    }
  });
}

async function processNonLoginCommands(message, client) {
  const from = message.from;
  const isUserLoggedIn = await verificarLogin(from);

  if (!isUserLoggedIn) {
    const comando = message.body.toLowerCase();

    switch (comando) {
      case "conectar":
        client.sendText(from, "Por favor, envie seu e-mail para login:");
        userTempData.set(from, { step: "email" });
        break;
      default:
        client.sendText(
          from,
          "Você precisa estar conectado. Use o comando 'conectar' para fazer login."
        );
        break;
    }
  } else {
    processarComandosLogados(message, client);
  }
}

async function listarArquivos(from, client) {
  try {
    const response = await axios.post(
      "https://cdn.viniciusdev.com.br/wabot/arquivos",
      { numero: from }
    );
    if (response.data.valid) {
      const arquivos = response.data.arquivos;
      let mensagemResposta = "Lista de arquivos:\n";
      arquivos.forEach((arquivo, index) => {
        const tamanhoMB = (parseInt(arquivo.size) / (1024 * 1024)).toFixed(2);
        const linkDownload = `https://cdn.viniciusdev.com.br/download?token=${arquivo.short}`; // Adicionando link de download
        mensagemResposta += `${index + 1}. Nome: ${
          arquivo.nome
        }, Tamanho: ${tamanhoMB} MB, Download: ${linkDownload}\n`;
      });
      client.sendText(from, mensagemResposta);
      userTempData.set(from, { step: "escolherArquivo", arquivos });
    } else {
      client.sendText(
        from,
        "Não foi possível listar os arquivos. Tente novamente mais tarde."
      );
    }
  } catch (error) {
    console.error("Erro ao listar arquivos:", error);
    client.sendText(
      from,
      "Houve um erro ao tentar listar os arquivos. Tente novamente mais tarde."
    );
  }
}

async function processarComandosLogados(message, client) {
  const from = message.from;
  const comando = message.body.toLowerCase();
  const messageType = message.type;

  console.log(message);

  if (
    messageType === "document" ||
    messageType === "audio" ||
    messageType === "video" ||
    messageType === "image"
  ) {
    const buffer = await client.decryptFile(message);
    console.log("Arquivo recebido:", message.filename);

    const randomFolder = uuidv4();
    const downloadPath = `./downloads/${randomFolder}/`;
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true });
    }

    const filePath = `${downloadPath}${message.filename}`;
    fs.writeFileSync(filePath, buffer);
    sendFileToAPI(filePath, from, client);
  }

  switch (comando) {
    case "desconectar":
      if (await desconct(from)) {
        client.sendText(from, "Você foi desconectado com sucesso!");
      } else {
        client.sendText(
          from,
          "Houve um erro ao tentar desconectar. Por favor, tente novamente."
        );
      }
      break;
    case "arquivos":
      listarArquivos(from, client);
      break;
    case "mudarsenha":
      client.sendText(from, "Por favor, envie a nova senha:");
      userTempData.set(from, { step: "mudarSenha" });
      break;
  }
}

async function verificarLogin(numero) {
  try {
    const response = await axios.post(
      "https://cdn.viniciusdev.com.br/wabot/check",
      { numero }
    );
    return response.data.valid;
  } catch (error) {
    console.error("Erro ao verificar o login:", error);
    return false;
  }
}

async function ObterToken(numero) {
  try {
    const response = await axios.post(
      "https://cdn.viniciusdev.com.br/wabot/check",
      { numero }
    );
    return response.data.token;
  } catch (error) {
    console.error("Erro ao verificar o login:", error);
    return false;
  }
}

async function sendFileToAPI(filePath, numero, client) {
  try {
    const token = await ObterToken(numero);

    if (!token) {
      console.error("Authorization token not available.");
      return;
    }

    const formData = new FormData();
    formData.append("arquivo", fs.createReadStream(filePath));
    formData.append("numero", numero);

    const fileStats = fs.statSync(filePath);
    formData.append("size", fileStats.size);
    formData.append("nome", path.basename(filePath));

    const response = await axios.post(
      "https://cdn.viniciusdev.com.br/upload_event",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: token,
        },
      }
    );

    client.sendText(
      numero,
      `O arquivo "${path.basename(filePath)}" foi enviado com sucesso.`
    );
  } catch (error) {
    console.error("Error sending file to API:", error);
    client.sendText(
      numero,
      "Houve um erro ao tentar enviar o arquivo. Por favor, tente novamente."
    );
  }
}

async function desconct(numero) {
  try {
    const response = await axios.post(
      "https://cdn.viniciusdev.com.br/wabot/logout",
      { numero }
    );
    return response.data.valid;
  } catch (error) {
    console.error("Erro ao verificar o login:", error);
    return false;
  }
}

function enviarLoginParaAPI(email, senha, client, from) {
  axios
    .post("https://cdn.viniciusdev.com.br/login/wa", {
      email: email,
      senha: senha,
      numero: from,
    })
    .then((response) => {
      const nome = response.data.nome;
      const plano = response.data.plano;
      client.sendText(
        from,
        `Você está conectado com sucesso!\nNome: ${nome}\nPlano: ${plano}`
      );
    })
    .catch((error) => {
      console.error("Erro ao enviar login para a API:", error);
      client.sendText(
        from,
        "Houve um erro ao tentar conectar. Por favor, tente novamente."
      );
    });
}

function processarEscolhaArquivo(from, escolha, client) {
  const userData = userTempData.get(from);
  const arquivos = userData.arquivos;
  const index = parseInt(escolha) - 1;

  if (arquivos && arquivos[index]) {
    const arquivoEscolhido = arquivos[index];
    client.sendText(
      from,
      `Você escolheu o arquivo: ${arquivoEscolhido.nome}. Para confirmar a exclusão, responda "apagar".`
    );
    userData.step = "confirmarApagar";
    userData.arquivoEscolhido = arquivoEscolhido;
    userTempData.set(from, userData);
  } else {
    client.sendText(
      from,
      "Número inválido. Por favor, escolha um número válido da lista."
    );
  }
}

async function apagarArquivo(arquivo, from, client) {
  console.log(`Apagando arquivo: ${arquivo.nome}`);
  client.sendText(from, `O arquivo "${arquivo.nome}" foi apagado com sucesso.`);
}

// ... (existing code)
