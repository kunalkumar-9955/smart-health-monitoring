const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Environment variables should be set in .env
// EMAIL_USER, EMAIL_PASS, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, ADMIN_PHONE_NUMBER

const sendAlert = async (alertData) => {
  console.log('🔔 Triggering real-time notifications for HIGH risk alert:', alertData.title);

  // 1. Email Notification
  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"HealthWatch Alerts" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER, // Send to admin
        subject: `🚨 URGENT: ${alertData.title}`,
        html: `
          <h2 style="color: #ef4444;">High Risk Alert Detected</h2>
          <p><strong>Village:</strong> ${alertData.village}</p>
          <p><strong>Risk Score:</strong> ${alertData.riskScore}</p>
          <p><strong>Details:</strong> ${alertData.message}</p>
          <p>Please log in to the HealthWatch dashboard immediately to allocate resources.</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ Alert email sent successfully.');
    } else {
      console.log('⚠️ Email credentials not configured, skipping email.');
    }
  } catch (err) {
    console.error('❌ Failed to send alert email:', err.message);
  }

  // 2. SMS Notification
  try {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER && process.env.ADMIN_PHONE_NUMBER) {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      await client.messages.create({
        body: `HealthWatch ALERT: ${alertData.title}. Score: ${alertData.riskScore}. Action required.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: process.env.ADMIN_PHONE_NUMBER
      });
      console.log('✅ Alert SMS sent successfully via Twilio.');
    } else {
      console.log('⚠️ Twilio credentials not configured, skipping SMS.');
    }
  } catch (err) {
    console.error('❌ Failed to send alert SMS:', err.message);
  }
};

module.exports = {
  sendAlert
};
