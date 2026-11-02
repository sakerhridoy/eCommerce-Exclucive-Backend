import { Resend } from 'resend';
import { config } from '../../config/index.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async options => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Exclusive E-commerce <onboarding@resend.dev>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error('RESEND API ERROR:', error);
      console.log('Email blocked by Resend, but continuing order process...');
      return;
    }

    console.log(`Email successfully sent via Resend to ${options.to}`, data);
  } catch (error) {
    console.error('RESEND CATCH ERROR DETAILS:', error.message);
    console.log(
      'Email delivery failed, but continuing with the order process...',
    );
  }
};