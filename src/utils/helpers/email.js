import nodemailer from 'nodemailer';
import { config } from '../../config/index.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
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
    console.log(`Email successfully sent to ${options.to}`); 
  } catch (error) {
    console.error('SMTP ERROR DETAILS:', error);
    throw new Error('Failed to send email');
  }
};