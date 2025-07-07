import nodemailer from "nodemailer";
import { config } from "../config/env.js";

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  createTransporter() {
    if (config.EMAIL_HOST && config.EMAIL_USER && config.EMAIL_PASSWORD) {
      // Use Brevo SMTP
      return nodemailer.createTransport({
        host: config.EMAIL_HOST,
        port: config.EMAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
          user: config.EMAIL_USER,
          pass: config.EMAIL_PASSWORD,
        },
      });
    } else {
      console.warn(
        "Email service not configured. Email features will not work."
      );
      return null;
    }
  }

  async sendEmail(to, subject, html, text) {
    if (!this.transporter) {
      console.error("Email transporter not configured");
      return false;
    }

    try {
      const mailOptions = {
        from: config.EMAIL_FROM,
        to,
        subject,
        html,
        text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", result.messageId);
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }

  async sendVerificationEmail(email, username, verificationToken) {
    const verificationUrl = `${config.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to NuttyFans!</h1>
          </div>
          <div class="content">
            <h2>Hi ${username},</h2>
            <p>Thank you for joining NuttyFans! Please verify your email address to complete your registration and start creating amazing content.</p>
            <p>Click the button below to verify your email:</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <p>Or copy and paste this link into your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 NuttyFans. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Hi ${username},
      
      Welcome to NuttyFans! Please verify your email address to complete your registration.
      
      Verification Link: ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account, please ignore this email.
    `;

    return this.sendEmail(email, "Verify Your Email Address", html, text);
  }

  async sendPasswordResetEmail(email, username, resetToken) {
    const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${username},</h2>
            <p>You requested to reset your password. Click the button below to create a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 NuttyFans. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Hi ${username},
      
      You requested to reset your NuttyFans password. Use the link below to create a new password:
      
      Reset Link: ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request a password reset, please ignore this email.
    `;

    return this.sendEmail(email, "Reset Your Password", html, text);
  }

  async sendWelcomeEmail(email, username) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to NuttyFans!</h1>
          </div>
          <div class="content">
            <h2>Hi ${username},</h2>
            <p>Your email has been successfully verified! Welcome to NuttyFans - the platform where creators thrive!</p>
            <p>You can now:</p>
            <ul>
              <li>Create and share exclusive content</li>
              <li>Connect with other amazing creators</li>
              <li>Build your fanbase and community</li>
              <li>Monetize your content with subscriptions and tips</li>
              <li>Interact with fans through direct messaging</li>
            </ul>
            <p>Get started by completing your profile and uploading your first post to start building your fanbase!</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 NuttyFans. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Hi ${username},
      
      Your email has been successfully verified! Welcome to NuttyFans - the platform where creators thrive!
      
      You can now create and share exclusive content, connect with other creators, build your fanbase, and monetize your work with subscriptions and tips.
      
      Get started by completing your profile and uploading your first post!
    `;

    return this.sendEmail(email, "Welcome! Your Account is Ready", html, text);
  }

  async sendLoginOTP(email, username, otp) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .otp-code { font-size: 32px; font-weight: bold; text-align: center; padding: 20px; background: #fff; border: 2px dashed #8b5cf6; margin: 20px 0; letter-spacing: 5px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your NuttyFans Login Code</h1>
          </div>
          <div class="content">
            <h2>Hi ${username || "there"},</h2>
            <p>Here's your One-Time Password (OTP) to login to NuttyFans:</p>
            <div class="otp-code">${otp}</div>
            <p><strong>Important:</strong></p>
            <ul>
              <li>This code will expire in 10 minutes</li>
              <li>Don't share this code with anyone</li>
              <li>Use this code only on the NuttyFans login page</li>
            </ul>
            <p>If you didn't request this code, please ignore this email and ensure your account is secure.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 NuttyFans. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Hi ${username || "there"},
      
      Your NuttyFans login code: ${otp}
      
      This code will expire in 10 minutes.
      Don't share this code with anyone.
      
      If you didn't request this code, please ignore this email.
      
      - NuttyFans Team
    `;

    return this.sendEmail(email, "Your NuttyFans Login Code", html, text);
  }
}

// Create and export singleton instance
const emailService = new EmailService();
export default emailService;
