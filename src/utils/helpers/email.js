import nodemailer from 'nodemailer';
import { config } from '../../config/index.js';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },

  tls: {
    rejectUnauthorized: false,
  },
});

export const sendEmail = async options => {
  try {
    const mailOptions = {
      from: config.email.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email successfully sent to ${options.to}`);
  } catch (error) {
    console.error('SMTP ERROR DETAILS:', error.message);
    console.log(
      'Email delivery failed, but continuing with the order process...',
    );
  }
};
