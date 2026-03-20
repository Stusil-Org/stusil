const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', 
  auth: {
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS, 
  },
});

exports.sendVerificationEmail = async (email, token) => {
  const url = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify-email?token=${token}`;
  
  await transporter.sendMail({
    from: '"Stusil" <noreply@stusil.org>',
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
};

exports.sendPasswordResetEmail = async (email, token) => {
  const url = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${token}`;
  
  await transporter.sendMail({
    from: '"Stusil" <noreply@stusil.org>',
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
};
