import { Response } from "express";

interface Client {
  response: Response;
  userId: number;
  gameId?: number;
  keepalive: NodeJS.Timeout;
}

const clients = new Map<number, Client>();
let nextClientId = 0;

function addClient(response: Response, userId: number, gameId?: number): number {
  const id = nextClientId++;

  response.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  response.write(":ok\n\n");

  const keepalive = setInterval(() => {
    try {
      response.write(":ping\n\n");
    } catch {
      clearInterval(keepalive);
    }
  }, 25_000);

  clients.set(id, { response, userId, gameId, keepalive });

  return id;
}

function removeClient(id: number): void {
  const client = clients.get(id);

  if (client) {
    clearInterval(client.keepalive);
  }

  clients.delete(id);
}

function broadcast(data: object): void {
  const message = `data: ${JSON.stringify(data)}\n\n`;

  for (const [, { response }] of clients) {
    response.write(message);
  }
}

function broadcastToGameUser(gameId: number, userId: number, data: object): void {
  const message = `data: ${JSON.stringify(data)}\n\n`;

  for (const [, client] of clients) {
    if (gameId === client.gameId && userId === client.userId) {
      client.response.write(message);
    }
  }
}

function broadcastToGame(gameId: number, data: object): void {
  const message = `data: ${JSON.stringify(data)}\n\n`;

  for (const [, client] of clients) {
    if (gameId === client.gameId) {
      client.response.write(message);
    }
  }
}

export default {
  addClient,
  broadcast,
  broadcastToGame,
  broadcastToGameUser,
  removeClient,
};
