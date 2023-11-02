import { io } from "socket.io-client";
const socket = io({
  autoConnect: false, auth: {
    token: process.env.SOCKET_SECRET,
  }
});

export { socket };
