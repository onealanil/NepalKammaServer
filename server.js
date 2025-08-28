/**
 * @file server.js
 * @description This is the main entry point of the application. It handles server clustering and socket.io setup.
 * @requires cluster - A module to create child processes that share server ports.
 * @requires os - A module to get information about the operating system.
 * @requires http - A module to create HTTP servers.
 * @requires socket.io - A library to enable real-time, bidirectional communication between web clients and servers.
 * @requires configureSocket - A module to configure socket.io for real-time communication.
 * @requires app - The Express application from app.js.
 * @author Anil Bhandari
 * @version 1.0.0
 */

import cluster from "cluster";
import os from "os";
import { createServer } from "http";
import { Server } from "socket.io";
import configureSocket from "./socketHandler.js";
import app from "./app.js";
import connectMongo from "./config/connection.js";
import logger from "./src/utils/logger.js";
import Job from "./models/Job.js";
import Gig from "./models/Gig.js";
import User from "./models/User.js";

/**
 * Clustering server.js
 */
// const numCpus = os.cpus().length;

// if (cluster.isPrimary) {
//   console.log(`Primary ${process.pid} is running`);

//   // Fork workers
//   for (let i = 0; i < numCpus; i++) {
//     cluster.fork();
//   }

//   cluster.on("exit", (worker, code, signal) => {
//     console.log(`Worker ${worker.process.pid} died`);
//     // Restart the worker
//     cluster.fork();
//   });
// } else {
//   // Worker process - this is where your Express app runs
//   const httpServer = createServer(app);

//   // Socket.io configuration
//   const io = new Server(httpServer, {
//     cors: {
//       origin: [
//         "http://localhost:8081",
//         "http://10.0.2.2:8081",
//         "http://192.168.20.68:8081",
//       ],
//       methods: ["GET", "POST"],
//       credentials: true,
//     },
//   });

//   // Configure socket.io
//   configureSocket(io);

//   // Attach io to app for use in routes
//   app.set("io", io);

//   // Start the server
//   httpServer.listen(8000, () => {
//     console.log(`Worker ${process.pid} started on port 8000`);
//   });
// }
/*********************
 * Just for launching app -> not handled more users
 * 
 * 
 */


async function startServer() {
  try {
    await connectMongo();

    /**
     * sync indexes
     */
    const indexResults = await Promise.allSettled([
      Job.syncIndexes(),
      Gig.syncIndexes(),
      User.syncIndexes()
    ]);

    indexResults.forEach((result, i) => {
      const modelName = ["Job", "Gig", "User"][i];
      const timestamp = new Date().toISOString();

      if (result.status === "fulfilled") {
        logger.info(`[${timestamp}] ${modelName} indexes synced successfully`);
      } else {
        logger.error(`[${timestamp}] Error syncing indexes for ${modelName}: ${result.reason}`);
      }
    });

    const httpServer = createServer(app);

    // Socket.io configuration
    const io = new Server(httpServer, {
      cors: {
        origin: "*", // Allow all origins for testing
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        credentials: true,
      },
      allowEIO3: true, // Allow Engine.IO v3 clients
      transports: ['websocket', 'polling']
    });

    // Configure socket.io
    configureSocket(io);

    // Attach io to app for use in routes
    app.set("io", io);

    const PORT = process.env.PORT || 8000;
    const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
    // const HOST = "0.0.0.0";


    // Start the server1
    const server = httpServer.listen(PORT, HOST, () => {
      logger.info(`Server started on ${HOST}:${PORT}`);
    });

    process.on("unhandledRejection", (err) => {
      logger.error(`Unhandled Rejection: ${err.name}, ${err.message}`);
      server.close(() => {
        process.exit(1);
      });
    });

    process.on("SIGTERM", () => {
      logger.info("Server shutting down.");
      server.close(() => process.exit(0));
    });

  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
