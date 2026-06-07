import { Server as SocketIOServer } from "socket.io";
import { NextApiResponse } from "next";
import { Server as NetServer } from "http";

export type NextApiResponseServerIo = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};