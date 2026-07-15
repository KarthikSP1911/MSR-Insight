import app from "./src/app.js";
import { startWeeklyCron } from "./src/cron.js";
import { connectRabbitMQ, closeRabbitMQ } from "./src/config/rabbitmq.config.js";
import { startEmailConsumer } from "./src/services/rabbitmq/email.consumer.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Initialize RabbitMQ and Consumer
  await connectRabbitMQ();
  await startEmailConsumer();

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startWeeklyCron(); // Register weekly attendance email digest
  });

  // Graceful shutdown handling
  const shutdown = async () => {
    console.log("[Server] Shutting down gracefully...");
    await closeRabbitMQ();
    server.close(() => {
      console.log("[Server] HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

startServer();
