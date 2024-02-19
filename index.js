const venom = require("venom-bot");
venom
  .create("minhaSessaoDeBot") // Nome da sessão
  .then((client) => {
    client.onMessage((message) => {
      if (message.body === "conectar" && !message.isGroupMsg) {
        client
          .sendText(message.from, "Olá, tudo bem?")
          .then(() =>
            client.sendText(
              message.from,
              "para vincular sua conta ao site https://servidor.viniciusdev.com.br acesse o link da próxima mensagem"
            )
          )
          .then(() =>
            client.sendText(
              message.from,
              "Fique à vontade para fazer perguntas."
            )
          )
          .catch((error) => console.error("Erro ao enviar: ", error));
      }
    });
  })
  .catch((error) => console.log(error));
