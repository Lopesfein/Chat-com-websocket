const { WebSocketServer, WebSocket } = require("ws");

// A variável de ambiente permite usar outra porta sem alterar o código.
const PORT = Number(process.env.PORT) || 8080;
const server = new WebSocketServer({ port: PORT });

server.on("connection", (socket) => {
  console.log("Cliente conectado");

  // Tratar o erro no próprio socket evita que erros de conexão encerrem o processo.
  socket.on("error", (error) => {
    console.error("Erro no socket:", error.message);
  });

  socket.on("message", (raw) => {
    let message;

    // Clientes enviam JSON; mensagens inválidas são descartadas sem interromper o servidor.
    try {
      message = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (!message || typeof message !== "object" || Array.isArray(message)) {
      return;
    }

    // O texto precisa existir e conter algo além de espaços.
    if (typeof message.text !== "string") {
      return;
    }

    const text = message.text.trim().slice(0, 500);
    if (!text) {
      return;
    }

    // Limitar os campos mantém o formato previsível para todos os participantes.
    const sender =
      typeof message.sender === "string" && message.sender.trim()
        ? message.sender.trim().slice(0, 30)
        : "Aluno";

    // O horário é definido pelo servidor para não depender do relógio do celular.
    const broadcastMessage = JSON.stringify({
      sender,
      text,
      time: Date.now(),
    });

    // Redistribuir a mesma mensagem a todos os clientes ainda conectados.
    server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(broadcastMessage);
      }
    });
  });

  socket.on("close", () => {
    console.log("Cliente desconectado");
  });
});

server.on("error", (error) => {
  console.error("Erro no servidor WebSocket:", error.message);
});

server.on("listening", () => {
  console.log(`Servidor ativo na porta ${PORT}`);
});
