import { getChannel, getQueueName } from "../../config/rabbitmq.config.js";
import { sendReportToAllParents } from "../email.service.js";
import prisma from "../../config/db.config.js";

/**
 * Start listening to the email reports queue
 */
export const startEmailConsumer = async () => {
    try {
        const channel = getChannel();
        const queueName = getQueueName();

        // Process 1 message at a time
        await channel.prefetch(1);

        console.log(`[RabbitMQ] Consumer listening on queue: ${queueName}`);

        channel.consume(queueName, async (msg) => {
            if (msg === null) return;

            let usn = "UNKNOWN";
            try {
                const payload = JSON.parse(msg.content.toString());
                usn = payload.usn;
                const htmlContent = payload.htmlContent;

                if (!usn || !htmlContent) {
                    throw new Error("Invalid payload: Missing usn or htmlContent");
                }

                console.log(`[RabbitMQ Consumer] Processing email job for USN: ${usn}`);

                // 1. Fetch student data from database
                const usn_upper = usn.toUpperCase();
                const student = await prisma.student.findUnique({
                    where: { usn: usn_upper },
                    select: {
                        usn: true,
                        name: true,
                        email: true,
                        parents: {
                            select: {
                                email: true,
                                name: true,
                                relation: true,
                            },
                        },
                    },
                });

                if (!student) {
                    throw new Error(`Student not found for USN: ${usn_upper}`);
                }

                if (!student.parents || student.parents.length === 0) {
                    throw new Error(`No parents found for student USN: ${usn_upper}`);
                }

                // 2. Execute existing logic to generate PDF and send email
                const emailResult = await sendReportToAllParents(
                    usn_upper,
                    { name: student.name },
                    student.parents,
                    htmlContent
                );

                console.log(`[RabbitMQ Consumer] Successfully processed email job for USN: ${usn_upper}`);
                console.log(`[RabbitMQ Consumer] Results: ${emailResult.successCount} succeeded, ${emailResult.failureCount} failed.`);
                
                // 3. Acknowledge message successfully
                channel.ack(msg);
            } catch (error) {
                console.error(`[RabbitMQ Consumer] Failed to process email job for USN: ${usn}. Error: ${error.message}`);
                
                // Nack (negative acknowledgement) pushes to DLQ because we configured x-dead-letter-exchange
                // The second parameter "false" tells RabbitMQ NOT to requeue it to the main queue,
                // which forces it to be routed to the DLX/DLQ.
                channel.nack(msg, false, false);
            }
        });
    } catch (error) {
        console.error("[RabbitMQ] Error starting email consumer:", error.message);
    }
};
