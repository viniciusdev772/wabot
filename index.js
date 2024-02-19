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

function start(client) {
  client.onMessage((message) => {
    if (message.body === "conectar" && message.isGroupMsg === false) {
      const numero = message.from;

      // Agora passa o client e o from como argumentos adicionais
      enviarNumeroParaAPI(numero, client, message.from);

      // Extrai o nome do remetente da mensagem
      const nome = message.sender.pushname || "lá";
      const saudacao = `Olá, ${nome}, tudo bem?`;

      client
        .sendText(message.from, saudacao)
        .then(() =>
          client.sendText(
            message.from,
            "Vou criar um link único de autenticação para você. Aguarde um momento."
          )
        )
        .then(() =>
          client.sendText(
            message.from,
            "Aguarde enquanto eu crio o link para você se conectar com o site https://servidor.viniciusdev.com.br/"
          )
        )
        .then(() =>
          client.sendText(message.from, "Fique à vontade para perguntar.")
        )
        .then((result) => {
          console.log("Result: ", result);
        })
        .catch((erro) => {
          console.error("Error when sending: ", erro);
        });
    }
  });
}

function enviarNumeroParaAPI(numero, client, from) {
  axios
    .post("https://cdn.viniciusdev.com.br/wabot/sign", { numero: numero })
    .then(function (response) {
      // Aqui você envia a resposta da API como uma nova mensagem
      const mensagemResposta = `Clique no link a seguir para se conectar com sucesso: ${response.data.link}`;
      client
        .sendText(from, mensagemResposta)
        .then((result) => {
          console.log(
            "Mensagem de resposta da API enviada com sucesso.",
            result
          );
        })
        .catch((erro) => {
          console.error("Erro ao enviar mensagem de resposta da API:", erro);
        });
    })
    .catch(function (error) {
      console.error("Erro ao enviar número para a API:", error);
    });
}
