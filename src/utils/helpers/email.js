import nodemailer from 'nodemailer';
import { config } from '../../config/index.js';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: Number(config.email.port), 
  secure: Number(config.email.port) === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
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
  } catch (error) {
    console.error('Nodemailer Error Details:', error);
    throw new Error('Failed to send email');
  }
};
