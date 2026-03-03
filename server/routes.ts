import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  app.get("/api/download-snapshot", (_req, res) => {
    const filePath = path.resolve("/home/runner/workspace/tco-snapshot.tar.gz");
    res.download(filePath, "tco-snapshot.tar.gz", (err) => {
      if (err) {
        res.status(404).send("File not found");
      }
    });
  });

  return httpServer;
}
