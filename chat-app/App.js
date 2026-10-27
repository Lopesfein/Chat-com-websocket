import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { WS_URL } from "./src/config";

export default function App() {
  const socket = useRef(null);
  const list = useRef(null);
  const [status, setStatus] = useState("Conectando...");
  const [sender, setSender] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [nameConfirmed, setNameConfirmed] = useState(false);

  useEffect(() => {
    // Uma conexão é aberta ao montar o app e guardada para envio e limpeza.
    const connection = new WebSocket(WS_URL);
    socket.current = connection;

    connection.onopen = () => setStatus("Conectado");
    connection.onmessage = (event) => {
      // Mensagens do servidor são exibidas; a mensagem enviada não é inserida localmente.
      try {
        const receivedMessage = JSON.parse(event.data);
        if (
          receivedMessage &&
          typeof receivedMessage.sender === "string" &&
          typeof receivedMessage.text === "string" &&
          typeof receivedMessage.time === "number"
        ) {
          setMessages((currentMessages) => [...currentMessages, receivedMessage]);
        }
      } catch {
        // Ignorar conteúdo que não esteja no formato JSON esperado.
      }
    };
    connection.onerror = () => setStatus("Erro na conexão");
    connection.onclose = () => setStatus("Desconectado");

    return () => {
      // Fechar a conexão ao desmontar evita deixar sockets abertos.
      connection.close();
      socket.current = null;
    };
  }, []);

  const sendMessage = () => {
    const text = messageText.trim();
    if (!text) {
      return;
    }

    if (!socket.current || socket.current.readyState !== WebSocket.OPEN) {
      setStatus("Sem conexão");
      return;
    }

    // O servidor redistribui a mensagem; não a mostramos antes de recebê-la de volta.
    socket.current.send(
      JSON.stringify({
        sender: sender.trim().slice(0, 30) || "Aluno",
        text,
        time: Date.now(),
      }),
    );
    setMessageText("");
  };

  const confirmName = () => {
    const name = sender.trim().slice(0, 30);
    if (name) {
      setSender(name);
      setNameConfirmed(true);
    }
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.sender === sender;
    const date = new Date(item.time);
    const formattedTime = `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes(),
    ).padStart(2, "0")}`;

    return (
      <View
        style={[
          styles.messageRow,
          isOwnMessage ? styles.ownMessageRow : styles.otherMessageRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
          ]}
        >
          {!isOwnMessage && <Text style={styles.sender}>{item.sender}</Text>}
          <Text style={styles.message}>{item.text}</Text>
          <Text style={styles.time}>{formattedTime}</Text>
        </View>
      </View>
    );
  };

  const isConnected = status === "Conectado";

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Chat da turma</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                isConnected ? styles.connectedDot : styles.disconnectedDot,
              ]}
            />
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>

        {!nameConfirmed ? (
          <View style={styles.nameScreen}>
            <Text style={styles.prompt}>Qual é o seu nome?</Text>
            <TextInput
              style={styles.input}
              value={sender}
              onChangeText={setSender}
              placeholder="Digite seu nome"
              maxLength={30}
              returnKeyType="done"
              onSubmitEditing={confirmName}
            />
            <Pressable
              style={[
                styles.button,
                styles.nameScreenButton,
                !sender.trim() && styles.buttonDisabled,
              ]}
              onPress={confirmName}
              disabled={!sender.trim()}
            >
              <Text style={styles.buttonText}>Entrar no chat</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <FlatList
              ref={list}
              style={styles.messageList}
              contentContainerStyle={styles.messageListContent}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item, index) => `${item.time}-${index}`}
              onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.emptyMessage}>
                  As mensagens aparecerão aqui quando o servidor as redistribuir.
                </Text>
              }
            />
            <View style={styles.composer}>
              <TextInput
                style={styles.messageInput}
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Digite uma mensagem..."
                multiline
                maxLength={500}
              />
              <Pressable
                style={[
                  styles.button,
                  (!isConnected || !messageText.trim()) && styles.buttonDisabled,
                ]}
                onPress={sendMessage}
                disabled={!isConnected || !messageText.trim()}
              >
                <Text style={styles.buttonText}>Enviar</Text>
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
  },
  title: {
    color: "#17212b",
    fontSize: 24,
    fontWeight: "700",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  statusDot: {
    width: 9,
    height: 9,
    marginRight: 7,
    borderRadius: 5,
  },
  connectedDot: {
    backgroundColor: "#24a148",
  },
  disconnectedDot: {
    backgroundColor: "#da1e28",
  },
  statusText: {
    color: "#52606d",
    fontSize: 14,
  },
  nameScreen: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  prompt: {
    marginBottom: 12,
    color: "#17212b",
    fontSize: 20,
    fontWeight: "600",
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#c5cdd5",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    fontSize: 16,
  },
  button: {
    minHeight: 46,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#1769aa",
  },
  buttonDisabled: {
    backgroundColor: "#9aa7b2",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  nameScreenButton: {
    marginTop: 12,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  emptyMessage: {
    alignSelf: "center",
    marginHorizontal: 20,
    color: "#687782",
    textAlign: "center",
  },
  messageRow: {
    flexDirection: "row",
    marginVertical: 5,
  },
  ownMessageRow: {
    justifyContent: "flex-end",
  },
  otherMessageRow: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "82%",
    minWidth: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  ownBubble: {
    backgroundColor: "#d7ebff",
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 4,
  },
  sender: {
    marginBottom: 3,
    color: "#1769aa",
    fontSize: 12,
    fontWeight: "700",
  },
  message: {
    color: "#17212b",
    fontSize: 16,
  },
  time: {
    alignSelf: "flex-end",
    marginTop: 4,
    color: "#687782",
    fontSize: 11,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#e1e5e9",
    backgroundColor: "#ffffff",
  },
  messageInput: {
    flex: 1,
    maxHeight: 110,
    minHeight: 44,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#c5cdd5",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    fontSize: 16,
  },
});
