import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const gmailUser = this.configService.get<string>('GMAIL_USER');
    const gmailAppPassword =
      this.configService.get<string>('GMAIL_APP_PASSWORD');

    this.logger.log('=== Mail Service Initialization (Gmail) ===');
    this.logger.log(`Gmail User: ${gmailUser}`);
    this.logger.log(
      `Gmail App Password configured: ${gmailAppPassword ? 'YES' : 'NO'}`,
    );

    if (!gmailUser || !gmailAppPassword) {
      this.logger.error(
        '❌ CRITICAL: Gmail configuration INCOMPLETE! Check your .env file.',
      );
      this.logger.error(
        `Missing: ${!gmailUser ? 'GMAIL_USER ' : ''}${!gmailAppPassword ? 'GMAIL_APP_PASSWORD ' : ''}`,
      );
      this.logger.error('Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env');
      // Don't create a transporter if credentials are missing
      this.transporter = null;
      return;
    }

    this.logger.log(`Creating Gmail transporter...`);
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    this.logger.log(
      `✅ Email transporter initialized successfully for ${gmailUser}`,
    );
  }

  private validateTransporter(): void {
    if (!this.transporter) {
      throw new Error(
        'Email service is not properly configured. Please check GMAIL_USER and GMAIL_APP_PASSWORD in .env file.',
      );
    }
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<boolean> {
    try {
      this.validateTransporter();

      const frontendUrl = this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      );
      const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
      const gmailUser = this.configService.get<string>('GMAIL_USER');

      this.logger.log(`Preparing to send password reset email to: ${email}`);
      this.logger.log(`Reset link: ${resetLink}`);
      this.logger.log(`From: ${gmailUser}`);

      const subject = 'Password Reset Request - Smart Accident Report System';

      const htmlTemplate = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #1e40af; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
      .content { background-color: #f5f5f5; padding: 30px; border-radius: 0 0 5px 5px; }
      .button { background-color: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
      .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      .warning { color: #d32f2f; font-size: 12px; margin-top: 15px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Password Reset Request</h1>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>We received a request to reset the password for your account associated with this email address.</p>
        <p>Please click the button below to reset your password. This link will expire in 1 hour.</p>
        <a href="${resetLink}" class="button">Reset Password</a>
        <p style="margin-top: 20px;">Or paste this link in your browser:</p>
        <p style="word-break: break-all; background-color: #fff; padding: 10px; border-radius: 3px;">
          ${resetLink}
        </p>
        <div class="warning">
          <strong>Security Note:</strong> If you did not request a password reset, please ignore this email or contact our support team immediately.
        </div>
        <div class="footer">
          <p><strong>Smart Accident Report System</strong></p>
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Smart Accident Report System. All rights reserved.</p>
        </div>
      </div>
    </div>
  </body>
</html>
      `;

      const textTemplate = `Password Reset Request - Smart Accident Report System

Hello,

We received a request to reset the password for your account associated with this email address.

Please use this link to reset your password. This link will expire in 1 hour.

${resetLink}

If you did not request a password reset, please ignore this email or contact our support team immediately.

---
Smart Accident Report System
This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} Smart Accident Report System. All rights reserved.`;

      const mailOptions = {
        from: gmailUser,
        to: email,
        subject,
        html: htmlTemplate,
        text: textTemplate,
      };

      this.logger.log(`Sending email to ${email}...`);
      const info = (await this.transporter!.sendMail(mailOptions)) as {
        messageId?: string;
      };
      this.logger.log(
        `✅ Password reset email sent successfully to ${email}. Message ID: ${info.messageId || 'N/A'}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `❌ Failed to send password reset email to ${email}`,
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw error;
    }
  }

  async sendPasswordResetSuccessEmail(email: string): Promise<boolean> {
    try {
      this.validateTransporter();
      const gmailUser = this.configService.get<string>('GMAIL_USER');

      const subject =
        'Password Reset Successful - Smart Accident Report System';

      const htmlTemplate = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #2e7d32; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
      .content { background-color: #f5f5f5; padding: 30px; border-radius: 0 0 5px 5px; }
      .success-icon { font-size: 40px; color: #2e7d32; }
      .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Password Reset Successful</h1>
      </div>
      <div class="content">
        <p style="text-align: center;">
          <span class="success-icon">✓</span>
        </p>
        <p>Hello,</p>
        <p>Your password has been successfully reset. You can now log in to your account with your new password.</p>
        <p>If you did not make this change or if you need further assistance, please contact our support team immediately.</p>
        <div class="footer">
          <p><strong>Smart Accident Report System</strong></p>
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Smart Accident Report System. All rights reserved.</p>
        </div>
      </div>
    </div>
  </body>
</html>
      `;

      const textTemplate = `Password Reset Successful - Smart Accident Report System

Hello,

Your password has been successfully reset. You can now log in to your account with your new password.

If you did not make this change or if you need further assistance, please contact our support team immediately.

---
Smart Accident Report System
This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} Smart Accident Report System. All rights reserved.`;

      const mailOptions = {
        from: gmailUser,
        to: email,
        subject,
        html: htmlTemplate,
        text: textTemplate,
      };

      const info = (await this.transporter!.sendMail(mailOptions)) as {
        messageId?: string;
      };
      this.logger.log(
        `✅ Password reset success email sent to ${email}. Message ID: ${info.messageId || 'N/A'}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `❌ Failed to send password reset success email to ${email}`,
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, fullName: string): Promise<boolean> {
    try {
      this.validateTransporter();
      const gmailUser = this.configService.get<string>('GMAIL_USER');

      const subject = 'Welcome to Smart Accident Report System';

      const htmlTemplate = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #1e40af; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
      .content { background-color: #f5f5f5; padding: 30px; border-radius: 0 0 5px 5px; }
      .features { list-style: none; padding: 0; }
      .features li { padding: 8px 0; }
      .features li:before { content: "✓ "; color: #2e7d32; font-weight: bold; }
      .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Welcome to Smart Accident Report System</h1>
      </div>
      <div class="content">
        <p>Hello ${fullName},</p>
        <p>Thank you for signing up! We are excited to have you on board.</p>
        <p>Our Smart Accident Report System helps you:</p>
        <ul class="features">
          <li>Report accidents quickly and efficiently</li>
          <li>Get AI-powered severity analysis</li>
          <li>Automatically dispatch emergency services</li>
          <li>Track accident reports in real-time</li>
        </ul>
        <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
        <div class="footer">
          <p><strong>Smart Accident Report System</strong></p>
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Smart Accident Report System. All rights reserved.</p>
        </div>
      </div>
    </div>
  </body>
</html>
      `;

      const textTemplate = `Welcome to Smart Accident Report System

Hello ${fullName},

Thank you for signing up! We are excited to have you on board.

Our Smart Accident Report System helps you:
✓ Report accidents quickly and efficiently
✓ Get AI-powered severity analysis
✓ Automatically dispatch emergency services
✓ Track accident reports in real-time

If you have any questions or need assistance, feel free to reach out to our support team.

---
Smart Accident Report System
This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} Smart Accident Report System. All rights reserved.`;

      const mailOptions = {
        from: gmailUser,
        to: email,
        subject,
        html: htmlTemplate,
        text: textTemplate,
      };

      const info = (await this.transporter!.sendMail(mailOptions)) as {
        messageId?: string;
      };
      this.logger.log(
        `✅ Welcome email sent to ${email}. Message ID: ${info.messageId || 'N/A'}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `❌ Failed to send welcome email to ${email}`,
        error instanceof Error ? error.stack : 'Unknown error',
      );
      throw error;
    }
  }

  async testEmailConnection(): Promise<boolean> {
    try {
      this.validateTransporter();
      await this.transporter!.verify();
      this.logger.log('✅ Email transporter connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error(
        '❌ Email transporter connection failed',
        error instanceof Error ? error.stack : 'Unknown error',
      );
      return false;
    }
  }
}
