const venom = require("venom-bot");
const axios = require("axios"); // Certifique-se de que o axios está instalado

venom
  .create({
    session: "session-name", // Nome da sessão
  })
  .then((client) => start(client))
  .catch((erro) => {
    console.log(erro);
  });

// Armazenará temporariamente os dados de login dos usuários
const loginTempData = new Map();

function start(client) {
  client.onMessage((message) => {
    const from = message.from;
    if (!message.isGroupMsg) {
      if (
        message.body.toLowerCase() === "conectar" &&
        !loginTempData.has(from)
      ) {
        loginTempData.set(from, { step: "email" });
        client.sendText(from, "Por favor, envie seu e-mail para login:");
      } else if (loginTempData.has(from)) {
        const userData = loginTempData.get(from);
        if (userData.step === "email") {
          userData.email = message.body;
          userData.step = "senha";
          loginTempData.set(from, userData);
          client.sendText(from, "Agora, por favor, envie sua senha:");
        } else if (userData.step === "senha") {
          enviarLoginParaAPI(userData.email, message.body, client, from);
          loginTempData.delete(from);
        }
      }
    }
  });
}

function enviarLoginParaAPI(email, senha, client, from) {
  axios
    .post("https://cdn.viniciusdev.com.br/login/wa", {
      email: email,
      senha: senha,
      numero: from,
    })
    .then(function (response) {
      // Supondo que a resposta da API venha com os campos 'nome' e 'plano' no corpo da resposta
      const nome = response.data.nome;
      const plano = response.data.plano;

      // Constrói a mensagem de resposta incluindo nome e plano
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
