/**
 * Tactico Custom Server
 * 
 * Runs Next.js + Socket.io + Game Engine in a SINGLE process.
 * This is the production server for Render deployment.
 * 
 * Architecture:
 *   Express → HTTP Server
 *     ├── Socket.io (WebSocket for real-time match simulation)
 *     └── Next.js (handles all HTTP routes + SSR)
 * 
 * One deploy. One process. One URL.
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import next from 'next';
import { GameLoop } from './game-loop';

// ─── Config ──────────────────────────────────────────────

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// ─── Initialize ──────────────────────────────────────────

const app = express();
const httpServer = createServer(app);

const nextApp = next({ dev, hostname, port });
const nextHandler = nextApp.getRequestHandler();

// Socket.io — attached to the SAME HTTP server as Next.js
const io = new SocketIOServer(httpServer, {
  path: '/api/socket',
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Game Loop — manages world ticks, match simulation, transfers
const gameLoop = new GameLoop(io);

// ─── Socket.io Events ────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // ── Career Management ──
  socket.on('career:start', (data) => {
    console.log(`[Socket] Career start: club ${data.clubId}`);
    gameLoop.startCareer(socket, data);
  });

  socket.on('career:continue', () => {
    gameLoop.continueCareer(socket);
  });

  // ── Match Simulation ──
  socket.on('match:play', (data) => {
    console.log(`[Socket] Match play: fixture ${data.fixtureId}`);
    gameLoop.playMatch(socket, data);
  });

  socket.on('match:tactics', (data) => {
    gameLoop.updateMatchTactics(socket, data);
  });

  socket.on('match:substitution', (data) => {
    gameLoop.makeSubstitution(socket, data);
  });

  // ── Transfer Market ──
  socket.on('transfer:search', (data) => {
    gameLoop.searchPlayers(socket, data);
  });

  socket.on('transfer:bid', (data) => {
    gameLoop.placeBid(socket, data);
  });

  socket.on('transfer:respond', (data) => {
    gameLoop.respondToBid(socket, data);
  });

  // ── Squad Management ──
  socket.on('squad:get', (data) => {
    gameLoop.getSquad(socket, data);
  });

  socket.on('squad:formation', (data) => {
    gameLoop.setFormation(socket, data);
  });

  // ── World State ──
  socket.on('world:state', () => {
    gameLoop.getWorldState(socket);
  });

  socket.on('world:standings', (data) => {
    gameLoop.getStandings(socket, data);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
    gameLoop.handleDisconnect(socket);
  });
});

// ─── Start Server ────────────────────────────────────────

async function start() {
  try {
    await nextApp.prepare();

    // All non-Socket routes go to Next.js
    app.all('*', (req, res) => nextHandler(req, res));

    httpServer.listen(port, () => {
      console.log(`
┌─────────────────────────────────────────────────┐
│                                                 │
│   ⚽ TACTICO Server running                     │
│                                                 │
│   → Environment: ${dev ? 'development' : 'production'}              │
│   → URL:         http://${hostname}:${port}             │
│   → Socket.io:   ws://${hostname}:${port}/api/socket    │
│   → Status:      Ready                          │
│                                                 │
└─────────────────────────────────────────────────┘
      `);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
}

start();
