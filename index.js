// Supports ES6
// import { create, Whatsapp } from 'venom-bot';
const venom = require("venom-bot");

venom
  .create({
    session: "session-name", //name of session
  })
  .then((client) => start(client))
  .catch((erro) => {
    console.log(erro);
  });

function start(client) {
  client.onMessage((message) => {
    if (message.body === "conectar" && message.isGroupMsg === false) {
      client
        .sendText(message.from, "Olá, tudo bem?")
        .then(() =>
          client.sendText(
            message.from,
            "Vou criar um link unico de autenticação para você. Aguarde um momento."
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
          console.error("Error when sending: ", erro); //retorna objeto de erro
        });
    }
  });
}
