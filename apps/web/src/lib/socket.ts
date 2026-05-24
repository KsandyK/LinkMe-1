import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:4000";

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
});

export const connectToStream = (streamId: string | number) => {
  if (!socket.connected) socket.connect();
  socket.emit("join-stream", streamId);
};

export const disconnectFromStream = () => {
  socket.disconnect();
};

export const sendChatMessage = (streamId: string | number, message: string, user: string) => {
  socket.emit("chat-message", { streamId, message, user });
};
