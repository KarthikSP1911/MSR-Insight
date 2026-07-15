import amqp from "amqplib";
import dotenv from "dotenv";
import logger from '../utils/logger.js';

dotenv.config();

let connection = null;
let channel = null;

const QUEUE_NAME = "email_reports_queue";
const DLQ_NAME = "email_reports_dlq";
const EXCHANGE_NAME = "email_reports_exchange";
const DLX_NAME = "email_reports_dlx";

export const connectRabbitMQ = async () => {
    if (connection && channel) return { connection, channel };

    const rabbitMqUrl = process.env.RABBITMQ_URL;
    
    if (!rabbitMqUrl) {
        logger.error("[RabbitMQ] CRITICAL: RABBITMQ_URL environment variable is missing.");
        process.exit(1);
    }

    try {
        logger.info("[RabbitMQ] Attempting to connect to CloudAMQP...");
        connection = await amqp.connect(rabbitMqUrl);
        channel = await connection.createChannel();
        logger.info("[RabbitMQ] Connected successfully!");

        // Setup Dead Letter Exchange and Queue
        await channel.assertExchange(DLX_NAME, "direct", { durable: true });
        await channel.assertQueue(DLQ_NAME, { durable: true });
        await channel.bindQueue(DLQ_NAME, DLX_NAME, "email_reports.dlq");

        // Setup Main Exchange and Queue (with DLX configuration)
        await channel.assertExchange(EXCHANGE_NAME, "direct", { durable: true });
        await channel.assertQueue(QUEUE_NAME, {
            durable: true,
            arguments: {
                "x-dead-letter-exchange": DLX_NAME,
                "x-dead-letter-routing-key": "email_reports.dlq",
            },
        });
        await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, "email_reports");

        return { connection, channel };
    } catch (error) {
        logger.error("[RabbitMQ] Failed to connect:", error.message);
        process.exit(1);
    }
};

export const getChannel = () => {
    if (!channel) {
        throw new Error("RabbitMQ Channel is not initialized. Call connectRabbitMQ first.");
    }
    return channel;
};

export const getQueueName = () => QUEUE_NAME;
export const getExchangeName = () => EXCHANGE_NAME;

export const closeRabbitMQ = async () => {
    try {
        if (channel) {
            await channel.close();
        }
        if (connection) {
            await connection.close();
        }
        logger.info("[RabbitMQ] Connection closed gracefully.");
    } catch (error) {
        logger.error("[RabbitMQ] Error while closing connection:", error.message);
    }
};
