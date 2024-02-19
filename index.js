const venom = require("venom-bot");

venom
  .create({
    session: "session-name", // Nome da sessão
    useChrome: true, // Utiliza o Chrome em vez de Chromium
    headless: true, // Executa o navegador em segundo plano
    devtools: false, // Desabilita as ferramentas de desenvolvedor
    dataPath: "./sessionData", // Caminho para salvar os dados da sessão
  })
  .then((client) => start(client))
  .catch((erro) => {
    console.log(erro);
  });

function start(client) {
  client.onMessage((message) => {
    if (message.body === "Hi" && message.isGroupMsg === false) {
      client
        .sendText(message.from, "Welcome Venom 🕷")
        .then((result) => {
          console.log("Result: ", result); // Retorna o objeto de sucesso
        })
        .catch((erro) => {
          console.error("Error when sending: ", erro); // Retorna o objeto de erro
        });
    }
  });
}
