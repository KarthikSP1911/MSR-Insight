import axios from "axios";
import { generatePDFFromHTML, uploadPDFToCloudinary } from "./email.service.js";

/**
 * Send WhatsApp message via Twilio REST API
 * @param {string} to - Recipient phone number
 * @param {string} body - Message body text
 * @returns {Promise<Object>} Twilio response data
 */
export const sendTwilioWhatsAppMessage = async (to, body) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials are not configured in environment variables.");
  }

  // Clean the phone number (remove spacing, dashes, and ensure + prefix if needed)
  let cleanTo = to.replace(/[\s\-\(\)]/g, "");
  if (!cleanTo.startsWith("+")) {
    // If no country code, default to Indian country code +91 as MSRIT is in Bangalore, India
    cleanTo = `+91${cleanTo}`;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const params = new URLSearchParams();
  params.append("To", `whatsapp:${cleanTo}`);
  params.append("From", from.startsWith("whatsapp:") ? from : `whatsapp:${from}`);
  params.append("Body", body);

  const response = await axios.post(url, params, {
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return response.data;
};

/**
 * Process WhatsApp report generation, upload, and optional dispatch
 * @param {string} studentUSN - Student USN
 * @param {string} studentName - Student Name
 * @param {Array} parents - List of parents with name, relation, phone
 * @param {string} htmlContent - Report HTML content
 * @returns {Promise<Object>} Results containing dispatch status and prepared templates
 */
export const processWhatsAppReport = async (
  studentUSN,
  studentName,
  parents,
  htmlContent,
) => {
  try {
    // 1. Generate PDF from HTML
    const pdfBuffer = await generatePDFFromHTML(htmlContent);

    // 2. Upload to Cloudinary to get a secure public URL
    const cloudinaryPublicId = `reports/${studentUSN}_${Date.now()}`;
    const cloudinaryResponse = await uploadPDFToCloudinary(
      pdfBuffer,
      cloudinaryPublicId,
    );
    const pdfUrl = cloudinaryResponse.secure_url;

    const isTwilioConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
    const results = [];

    for (const parent of parents) {
      if (!parent.phone) {
        results.push({
          parentName: parent.name,
          relation: parent.relation,
          status: "skipped",
          message: "No phone number available for parent.",
        });
        continue;
      }

      // Compile message body
      const messageBody = `🎓 *M S Ramaiah Institute of Technology* 🎓\n\n` +
        `Dear *${parent.name}*,\n\n` +
        `This is an official update from MSRIT. The academic performance report of your child, *${studentName}* (${studentUSN}), is now ready for your review.\n\n` +
        `Please view or download the complete PDF report securely on Cloudinary:\n` +
        `🔗 ${pdfUrl}\n\n` +
        `*Report Highlights:*\n` +
        `• Semester GPA & Credit Analysis\n` +
        `• Course-wise Attendance Statistics\n` +
        `• Faculty Proctor Observations\n\n` +
        `If you have any academic concerns, please contact the assigned Department Faculty Proctor.\n\n` +
        `Best regards,\n` +
        `*MSR Insight Management System*`;

      let status = "ready";
      let twilioMessageId = null;
      let error = null;

      if (isTwilioConfigured) {
        try {
          const twilioResult = await sendTwilioWhatsAppMessage(parent.phone, messageBody);
          status = "sent";
          twilioMessageId = twilioResult.sid;
        } catch (err) {
          status = "failed";
          error = err.message;
        }
      }

      results.push({
        parentName: parent.name,
        relation: parent.relation,
        phone: parent.phone,
        status,
        messageBody,
        twilioMessageId,
        error,
      });
    }

    return {
      pdfUrl,
      isTwilioConfigured,
      results,
    };
  } catch (error) {
    throw new Error(`Failed to process WhatsApp report: ${error.message}`);
  }
};
