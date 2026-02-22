import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendTicketEmail = async (to, ticketData) => {
  const { ticketId, eventTitle, qrCode, participantName } = ticketData;

  const mailOptions = {
    from: `"Felicity Events" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: `Your Ticket for ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Your Event Ticket</h2>
        <p>Hello ${participantName},</p>
        <p>Thank you for registering for <strong>${eventTitle}</strong>!</p>
        
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Ticket ID: ${ticketId}</h3>
          <img src="${qrCode}" alt="QR Code" style="max-width: 200px; display: block; margin: 20px auto;" />
        </div>
        
        <p>Please present this QR code at the event venue.</p>
        <p>You can also access your ticket from your dashboard at any time.</p>
        
        <p style="margin-top: 30px; color: #6B7280; font-size: 12px;">
          This is an automated email. Please do not reply.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

export const sendOrganizerCredentials = async (to, credentials) => {
  const { clubName, email, password } = credentials;

  const mailOptions = {
    from: `"Felicity Admin" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: 'Your Felicity Organizer Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Welcome to Felicity!</h2>
        <p>Hello ${clubName},</p>
        <p>Your organizer account has been created. Here are your login credentials:</p>
        
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> ${password}</p>
        </div>
        
        <p><strong>Important:</strong> Please change your password after your first login.</p>
        <p>Login at: ${process.env.FRONTEND_URL}/login</p>
        
        <p style="margin-top: 30px; color: #6B7280; font-size: 12px;">
          This is an automated email. Please do not reply.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};
