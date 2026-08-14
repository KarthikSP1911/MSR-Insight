import app from "./src/app.js";
import { startWeeklyCron } from "./src/cron.js";
import { connectRabbitMQ, closeRabbitMQ } from "./src/config/rabbitmq.config.js";
import { startEmailConsumer } from "./src/services/rabbitmq/email.consumer.js";
import logger from "./src/utils/logger.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Initialize RabbitMQ and Consumer
  await connectRabbitMQ();
  await startEmailConsumer();

  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    startWeeklyCron(); // Register weekly attendance email digest
  });

  // Graceful shutdown handling
  const shutdown = async () => {
    logger.info("Shutting down gracefully...");
    await closeRabbitMQ();
    server.close(() => {
      logger.info("HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

startServer();
