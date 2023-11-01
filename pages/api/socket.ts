import { NextApiRequest, NextApiResponse } from "next";
import { Server } from "socket.io";

import type { Socket as NetSocket } from "net";
import type { Server as HttpServer } from "http";
import type { Server as IOServer } from "socket.io";
import type { Socket } from "socket.io";

interface SocketServer extends HttpServer {
  io?: IOServer;
}

interface SocketServerWithIO extends NetSocket {
  server: SocketServer;
}

interface ResponseWithSocket extends NextApiResponse {
  socket: SocketServerWithIO;
}

export default function handler(
  req: NextApiRequest,
  res: ResponseWithSocket,
) {
  if (req.method !== "POST")
    return res.status(405).end();

  if (res.socket.server.io) {
    return res.send("server is already running");
  }

  const io = new Server(res.socket.server, { addTrailingSlash: false });
  io.on("connection", (socket: Socket) => {
    socket.on("disconnect", () => console.log("disconnected"));
    socket.emit("msg", "Connected!");

  });
  res.socket.server.io = io;

  return res.end();
}
