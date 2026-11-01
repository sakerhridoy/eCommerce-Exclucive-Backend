import { asyncHandler, sendResponse, sendEmail } from '../utils/index.js';

export const sendContactMessage = asyncHandler(async (req, res) => {
  const { name, email, phone, message } = req.body;

  const adminEmail = process.env.EMAIL_USER || 'support@exclusive.com';

  try {
    await sendEmail({
      to: adminEmail,
      subject: `New Contact Message from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #DB4444;">New Customer Inquiry</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Message:</strong></p>
          <p style="background: #f9f9f9; padding: 10px; border-left: 4px solid #DB4444;">${message}</p>
        </div>
      `,
    });

    sendResponse(res, {
      message: 'Your message has been sent successfully',
      statusCode: 200,
    });
  } catch (error) {
    console.error('Failed to send contact email:', error);
    res.status(500);
    throw new Error('Failed to send message. Please try again later.');
  }
});
