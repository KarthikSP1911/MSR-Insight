import { getChannel, getExchangeName } from "../../config/rabbitmq.config.js";
import logger from '../../utils/logger.js';

/**
 * Publish an email generation job to RabbitMQ
 * @param {Object} payload - Must contain { usn, htmlContent }
 * @returns {Promise<boolean>} True if successfully pushed to the queue
 */
export const publishEmailJob = async (payload) => {
    try {
        const channel = getChannel();
        const exchange = getExchangeName();
        
        // Publish to the main exchange with routing key 'email_reports'
        const success = channel.publish(
            exchange, 
            "email_reports", 
            Buffer.from(JSON.stringify(payload)),
            { persistent: true } // Ensure message survives broker restarts
        );
        
        if (success) {
            logger.info(`[RabbitMQ] Successfully queued email job for USN: ${payload.usn}`);
        } else {
            logger.warn(`[RabbitMQ] Failed to queue email job for USN: ${payload.usn} (Channel returned false)`);
        }
        
        return success;
    } catch (error) {
        logger.error(`[RabbitMQ] Error publishing email job for USN: ${payload?.usn}`, error.message);
        throw error;
    }
};
