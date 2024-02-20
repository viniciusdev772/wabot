const venom = require("venom-bot");
const axios = require("axios");

venom
  .create({
    session: "session-name",
  })
  .then((client) => start(client))
  .catch((erro) => {
    console.log(erro);
  });

const loginTempData = new Map();

async function start(client) {
  client.onMessage(async (message) => {
    const from = message.from;
    if (!message.isGroupMsg) {
      const isUserLoggedIn = await verificarLogin(from);
      if (message.body.toLowerCase() === "conectar" && !isUserLoggedIn) {
        loginTempData.set(from, { step: "email" });
        client.sendText(from, "Por favor, envie seu e-mail para login:");
        return;
      }

      if (isUserLoggedIn) {
        processarComandosLogados(message, client);
        return;
      }

      if (loginTempData.has(from)) {
        const userData = loginTempData.get(from);
        if (userData.step === "email") {
          userData.email = message.body;
          userData.step = "senha";
          loginTempData.set(from, userData);
          client.sendText(from, "Agora, por favor, envie sua senha:");
        } else if (userData.step === "senha") {
          enviarLoginParaAPI(userData.email, message.body, client, from);
          loginTempData.delete(from);
        } else if (userData.step === "escolherArquivo") {
          processarEscolhaArquivo(from, message.body, client);
        }
      }
    }
  });
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
      loginTempData.set(from, { step: "escolherArquivo", arquivos });
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

  switch (comando) {
    case "arquivos":
      listarArquivos(from, client);
      break;
    case "mudarsenha":
      client.sendText(from, "Por favor, envie a nova senha:");
      loginTempData.set(from, { step: "mudarSenha" });
      break;
    default:
      client.sendText(from, "Comando não reconhecido. Tente novamente.");
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

function enviarLoginParaAPI(email, senha, client, from) {
  axios
    .post("https://cdn.viniciusdev.com.br/login/wa", {
      email: email,
      senha: senha,
      numero: from,
    })
    .then(function (response) {
      const nome = response.data.nome;
      const plano = response.data.plano;
      const mensagemResposta = `Você está conectado com sucesso!\nNome: ${nome}\nPlano: ${plano}`;
      client.sendText(from, mensagemResposta);
    })
    .catch(function (error) {
      console.error("Erro ao enviar login para a API:", error);
      client.sendText(
        from,
        "Houve um erro ao tentar conectar. Por favor, tente novamente."
      );
    });
}

function processarEscolhaArquivo(from, escolha, client) {
  const userData = loginTempData.get(from);
  const index = parseInt(escolha) - 1;
  const arquivo = userData.arquivos[index];

  if (arquivo) {
    client.sendText(
      from,
      `Você escolheu o arquivo: ${arquivo.nome}. Para apagar, responda "apagar".`
    );
    // Atualiza o passo para esperar pela confirmação de apagar
    userData.step = "confirmarApagar";
    userData.arquivoEscolhido = arquivo;
    loginTempData.set(from, userData);
  } else {
    client.sendText(
      from,
      "Opção inválida. Por favor, escolha um número da lista."
    );
  }
}
