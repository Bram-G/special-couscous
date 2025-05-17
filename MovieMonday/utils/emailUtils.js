// In src/utils/emailUtils.js (create this file if it doesn't exist)
const crypto = require('crypto')
const nodemailer = require('nodemailer');

// Create a transporter (replace with your actual email service)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send verification email
const sendVerificationEmail = async (user, hostOrOrigin) => {
  try {
    // Generate token if one doesn't exist
    if (!user.verificationToken) {
      user.verificationToken = crypto.randomBytes(32).toString('hex');
      user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await user.save();
    }

    // Determine base URL
    const isFullUrl = hostOrOrigin.startsWith('http');
    const baseUrl = isFullUrl ? hostOrOrigin : `https://${hostOrOrigin}`;
    
    // Create verification URL
    const verificationUrl = `${baseUrl}/verify-email/${user.verificationToken}`;
    
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Movie Monday" <noreply@moviemonday.com>',
      to: user.email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Hello ${user.username},</p>
          <p>Thank you for registering with Movie Monday! Please click the button below to verify your email address:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #5E35B1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email Address
            </a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all;"><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
          <p>Regards,<br>The Movie Monday Team</p>
        </div>
      `
    };
    
    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${user.email}`);
    
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (user, hostOrOrigin) => {
  // Similar implementation as verification email
  try {
    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    // Determine base URL
    const isFullUrl = hostOrOrigin.startsWith('http');
    const baseUrl = isFullUrl ? hostOrOrigin : `https://${hostOrOrigin}`;
    
    // Create reset URL
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
    
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Movie Monday" <noreply@moviemonday.com>',
      to: user.email,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset</h2>
          <p>Hello ${user.username},</p>
          <p>You requested to reset your password. Please click the button below to set a new password:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #5E35B1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <p>Regards,<br>The Movie Monday Team</p>
        </div>
      `
    };
    
    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${user.email}`);
    
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };