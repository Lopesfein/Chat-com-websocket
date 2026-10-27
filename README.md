# Chat em tempo real

Projeto didático com um servidor Node.js (`ws`) e um app React Native (Expo).

## Fluxo

```text
Celular A  →  Servidor WebSocket  →  Celular B
     ↑                 │                 ↑
     └────── mensagem redistribuída ─────┘
```

O celular envia a mensagem ao servidor; o servidor valida, define o horário e a redistribui a todos os clientes conectados.

## Instalação e execução

Em um terminal, inicie o servidor:

```bash
cd chat-server
npm install
node server.js
```

Em outro terminal, inicie o aplicativo:

```bash
cd chat-app
npm install
npx expo start
```

Antes de iniciar o app, ajuste `WS_URL` em `chat-app/src/config.js` para o IP e o ambiente de execução. Para uma porta diferente, defina `PORT` no ambiente do servidor.

## Descobrir o IP local

- Windows: execute `ipconfig` e procure o endereço IPv4 do adaptador Wi-Fi.
- macOS/Linux: execute `ifconfig` (ou `ip addr`) e procure o endereço da interface Wi-Fi.
- O celular físico e o computador devem estar na mesma rede Wi-Fi, e o firewall deve permitir conexões na porta 8080.

## Roteiro de teste

1. Inicie o servidor e confirme que ele informa a porta ativa.
2. Configure o endereço correto em `WS_URL` e inicie o Expo.
3. Abra o app em dois dispositivos, informe nomes diferentes e aguarde o status **Conectado**.
4. Envie uma mensagem de um dispositivo e confirme que ela aparece nos dois, com horário e alinhamento próprios.
5. Responda no segundo dispositivo e observe o fluxo inverso.

## Diagnóstico

| Sintoma | Causa provável |
|---|---|
| Não conecta | Servidor desligado, porta incorreta ou firewall bloqueando a conexão. |
| Funciona no PC mas não no celular | URL usa `localhost`, IP incorreto, redes diferentes ou porta não liberada no firewall. |
| Mensagem não aparece | O socket não está conectado ou o servidor descartou JSON inválido/texto vazio. |
| Erro ao enviar | Conexão fechada ou instável; confirme o status e o endereço do servidor. |

## Limitações do protótipo

- Mensagens ficam apenas em memória; o histórico é perdido ao reiniciar o servidor.
- Não há login, banco de dados nem conexão `wss://`.
- Não há reconexão automática.

## Próximos passos

- Adicionar `wss://` com TLS e autenticação.
- Persistir mensagens em um banco de dados.
- Implementar reconexão com backoff e salas diferentes.
- Incluir rate limiting para controlar o volume de mensagens.

## Perguntas de revisão

1. Qual é o papel do servidor no caminho da mensagem entre dois celulares?
2. O que a função `onmessage` faz no aplicativo?
3. Por que verificar `readyState` antes de enviar uma mensagem?
