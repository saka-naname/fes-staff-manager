import { NextApiRequest, NextApiResponse } from "next";
import { Server } from "socket.io";

import type { Socket as NetSocket } from "net";
import type { Server as HttpServer } from "http";
import type { Server as IOServer } from "socket.io";
import type { Socket } from "socket.io";
import { Member, Status } from "@prisma/client";
import { sha256 } from "js-sha256";
import { StatusWithMember } from "@/lib/types";

interface SocketServer extends HttpServer {
  io?: IOServer;
}

interface SocketServerWithIO extends NetSocket {
  server: SocketServer;
}

interface ResponseWithSocket extends NextApiResponse {
  socket: SocketServerWithIO;
}

const socket_secret = process.env.SOCKET_SECRET;

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
    socket.emit("token", generateToken(socket));

    socket.on("member_enter", (status: StatusWithMember, token: string) => {
      if (auth(socket, token)) {
        io.emit("member_entered", status.member.id);
      } else {
        socket.emit("msg", "Unauthorized");
      }
    });
    socket.on("member_exit", (status: StatusWithMember, token: string) => {
      if (auth(socket, token)) {
        io.emit("member_exited", status.member.id);
      } else {
        socket.emit("msg", "Unauthorized");
      }
    });
  });
  res.socket.server.io = io;

  return res.end();
}

const auth = (socket: Socket, token: string) => {
  return generateToken(socket) === token;
}

const generateToken = (socket: Socket) => {
  return sha256(socket_secret + socket.id);
}
