const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Verification check function (mock for Resend since it uses HTTP API, not SMTP socket)
exports.verifyEmailService = async () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Missing RESEND_API_KEY');
  }
  return true;
};

// Map exports.transporter for any existing server checks (even though Resend doesn't use it)
exports.transporter = {
  verify: exports.verifyEmailService
};

exports.sendVerificationEmail = async (email, token) => {
  const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:8080').replace(/\/$/, '');
  const url = `${baseUrl}/verify-email?token=${token}`;
  
  const { data, error } = await resend.emails.send({
    from: 'Stusil <onboarding@resend.dev>', // Resend default testing sender
    to: email,
    subject: "Verify your Stusil account",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #6366f1;">Welcome to Stusil!</h2>
        <p>Thank you for joining our community of student innovators. Please verify your email to unlock all features.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p style="font-size: 12px; color: #666;">If you didn't create this account, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    console.error('RESEND VERIFICATION EMAIL ERROR:', error);
    throw new Error(error.message);
  }
};

exports.sendPasswordResetEmail = async (email, token) => {
  const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:8080').replace(/\/$/, '');
  const url = `${baseUrl}/reset-password?token=${token}`;
  
  const { data, error } = await resend.emails.send({
    from: 'Stusil <onboarding@resend.dev>',
    to: email,
    subject: "Reset your Stusil password",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #6366f1;">Password Reset Request</h2>
        <p>We received a request to reset your password. Click the button below to choose a new one.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="font-size: 12px; color: #666;">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    console.error('RESEND PASSWORD RESET ERROR:', error);
    throw new Error(error.message);
  }
};
