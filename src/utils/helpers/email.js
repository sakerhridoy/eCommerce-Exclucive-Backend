import { Resend } from 'resend';
import { config } from '../../config/index.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async options => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Exclusive E-commerce <onboarding@resend.dev>',

      to: 'sakerahmedhridoy@gmail.com',

      subject: `New Order Alert! (Customer: ${options.to})`,

      html: options.html,
    });

    if (error) {
      console.error('RESEND API ERROR:', error);
      console.log('Email blocked, but continuing order process...');
      return;
    }

    console.log(`Admin notification successfully sent to your email!`);
  } catch (error) {
    console.error('RESEND CATCH ERROR DETAILS:', error.message);
    console.log(
      'Email delivery failed, but continuing with the order process...',
    );
  }
};
