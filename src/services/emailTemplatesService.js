export const emailTemplates = {
  emailVerification: (user, verificationLink) => ({
    subject: 'Verify your SingleV email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify your email, ${user.name}</h2>
        <p>Confirm your email address to finish setting up your account.</p>
        <a href="${verificationLink}" style="background: #DB4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify email</a>
        <p>If you did not create this account, you can ignore this message.</p>
      </div>
    `
  }),

  welcome: (user) => ({
    subject: 'Welcome to SingleV!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to SingleV, ${user.name}!</h2>
        <p>Thank you for joining us. We're excited to have you as a customer.</p>
        <p>Start shopping now and discover amazing products!</p>
      </div>
    `
  }),

  passwordReset: (resetLink) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 15 minutes.</p>
      </div>
    `
  }),

  orderConfirmation: (order) => ({
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Thank You for Your Order!</h2>
        <p>Order Number: ${order.orderNumber}</p>
        <p>Order Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
        <h3>Order Details:</h3>
        <p>Total: $${order.total.toFixed(2)}</p>
        <p>Status: ${order.orderStatus}</p>
      </div>
    `
  }),

  orderStatusUpdate: (order) => ({
    subject: `Order Update - ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Order Status Has Been Updated!</h2>
        <p>Order Number: ${order.orderNumber}</p>
        <p>New Status: ${order.orderStatus}</p>
      </div>
    `
  })
};
