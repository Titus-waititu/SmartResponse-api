# Email Configuration Guide - Nodemailer Setup

This guide explains how to configure Nodemailer for the Smart Accident Report System to send password reset and other transactional emails.

## Overview

The system uses **Nodemailer** to send transactional emails including:

- Password reset requests
- Password reset success confirmations
- Welcome emails for new users

## Configuration Options

### 1. Gmail Configuration (Recommended for Testing)

**Prerequisites:**

- Gmail account
- [2-Step Verification enabled](https://myaccount.google.com/security)
- [App Password generated](https://myaccount.google.com/apppasswords)

**Steps:**

1. Go to [Google Account Security Settings](https://myaccount.google.com/security)
2. Enable "2-Step Verification" if not already enabled
3. Generate an "App Password" for Mail/Windows
4. Copy the generated 16-character password

**Environment Variables:**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM=noreply@smartaccidentreport.com
FRONTEND_URL=http://localhost:3000
```

### 2. Mailtrap Configuration (Best for Development)

**Benefits:**

- Free tier with 500 emails/month
- No real emails sent (safe for testing)
- Easy to inspect sent emails
- Perfect for development environment

**Steps:**

1. Go to [Mailtrap.io](https://mailtrap.io/) and sign up

2. Navigate to Email -> Testing -> Integration

3. Select "Nodemailer" from the dropdown

4. Copy your credentials

**Environment Variables:**

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user-id
SMTP_PASSWORD=your-mailtrap-password
SMTP_FROM=noreply@smartaccidentreport.com
FRONTEND_URL=http://localhost:3000
```

### 3. SendGrid Configuration (Production Ready)

**Steps:**

1. Create [SendGrid account](https://sendgrid.com/)
2. Create an API key
3. Verify sender email

**Environment Variables:**

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxx
SMTP_FROM=noreply@smartaccidentreport.com
FRONTEND_URL=https://your-production-url.com
```

### 4. Other SMTP Providers

For other providers (AWS SES, Mailgun, Brevo, etc.), check their documentation for SMTP settings.

## Email Templates

### Password Reset Email

- **Trigger**: User clicks "Forgot Password" → Submits email
- **Content**:
  - Reset link (valid for 1 hour)
  - Security warning
  - Professional HTML template with fallback text

### Password Reset Success Email

- **Trigger**: User successfully resets password
- **Content**:
  - Confirmation message
  - Security notification
  - Professional HTML template

### Welcome Email

- **Trigger**: New user registration (optional)
- **Content**:
  - Welcome message
  - Feature overview
  - Getting started information

## Implementation Details

### Mail Service (`src/mail/mail.service.ts`)

The `MailService` class provides:

```typescript
// Send password reset email with token
await mailService.sendPasswordResetEmail(email, resetToken);

// Send password reset success confirmation
await mailService.sendPasswordResetSuccessEmail(email);

// Send welcome email for new users
await mailService.sendWelcomeEmail(email, fullName);

// Test email connection
await mailService.testEmailConnection();
```

### Integration in Auth Service

The `AuthService` automatically uses `MailService` for:

1. **Forgot Password** (`POST /api/auth/forgot-password`)
   - Generates JWT reset token (1-hour expiration)
   - Sends email with reset link
   - Returns success message

2. **Reset Password** (`POST /api/auth/reset-password`)
   - Validates reset token
   - Updates password
   - Sends confirmation email

## Environment Variables Reference

| Variable        | Required | Example                         | Description                                 |
| --------------- | -------- | ------------------------------- | ------------------------------------------- |
| `SMTP_HOST`     | Yes      | smtp.gmail.com                  | SMTP server hostname                        |
| `SMTP_PORT`     | Yes      | 587                             | SMTP server port (587 for TLS, 465 for SSL) |
| `SMTP_USER`     | Yes      | your-email@gmail.com            | SMTP authentication username                |
| `SMTP_PASSWORD` | Yes      | your-app-password               | SMTP authentication password                |
| `SMTP_FROM`     | Yes      | noreply@smartaccidentreport.com | "From" email address                        |
| `FRONTEND_URL`  | No       | http://localhost:3000           | Frontend URL for reset links                |

## Testing Email Configuration

### 1. Using the Mail Service Test Endpoint

Create a test endpoint to verify email configuration:

```bash
# Test email connection
curl -X GET http://localhost:8000/api/mail/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Manual Testing in Development

Use Mailtrap to:

- Inspect sent emails
- Check HTML rendering
- Verify links and formatting

### 3. Integration Testing

The system includes password reset flow:

```bash
# 1. Request password reset
curl -X POST http://localhost:8000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# 2. Extract reset token from email (Mailtrap shows it)
# 3. Reset password using token
curl -X POST http://localhost:8000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGc...",
    "newPassword": "newpassword123",
    "confirmPassword": "newpassword123"
  }'
```

## Troubleshooting

### "Email configuration incomplete" Warning

**Cause**: Missing SMTP environment variables

**Solution**: Ensure all required variables are set in `.env`:

```env
SMTP_HOST=your-host
SMTP_PORT=your-port
SMTP_USER=your-user
SMTP_PASSWORD=your-password
```

### "Failed to send email" Error

**Possible causes**:

1. Incorrect SMTP credentials
2. SMTP server firewall/security blocking connection
3. Invalid "From" email address
4. Rate limiting from email provider

**Solutions**:

1. Verify credentials in your email provider
2. Check SMTP server settings (TLS/SSL port)
3. Use verified sender email
4. Review email provider's rate limits

### Gmail "Less secure apps" Error

Gmail removed "Less secure app access". Use **App Passwords** instead:

```env
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # 16-character app password (spaces can be omitted)
```

### Mailtrap Not Receiving Test Emails

1. Ensure `SMTP_PORT=2525` (not 587 or 465)
2. Check Mailtrap dashboard for emails in "Trash" folder
3. Verify "From" email matches configuration

## Production Deployment

When deploying to production:

1. **Use a professional SMTP service**:
   - SendGrid
   - AWS SES
   - Mailgun
   - Brevo (Sendinblue)

2. **Set strong environment variables**:

   ```bash
   export SMTP_HOST="your-production-smtp"
   export SMTP_PASSWORD="your-secure-password"
   export FRONTEND_URL="https://yourdomain.com"
   ```

3. **Monitor email deliverability**:
   - Check bounce rates
   - Monitor spam complaints
   - Set up SPF/DKIM/DMARC records

4. **Use environment-specific templates**:
   - Development: Use Mailtrap for testing
   - Staging: Use actual SMTP with test emails
   - Production: Use verified SMTP service

## Email Logs

Check application logs for email operations:

```bash
# View email service logs
tail -f logs/app.log | grep "MailService"
```

Example log output:

```
[MailService] Email transporter initialized for smtp.gmail.com:587
[MailService] Password reset email sent to user@example.com. Message ID: ...
[MailService] Failed to send welcome email to user@example.com
```

## Additional Features

The `MailService` is extensible. You can add more email types:

```typescript
async sendEmergencyAlertEmail(
  email: string,
  accidentDetails: AccidentDetails
): Promise<boolean> {
  // Implementation here
}

async sendDispatchCancellationEmail(
  dispatcherId: string,
  accidentId: string
): Promise<boolean> {
  // Implementation here
}
```

## Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Mailtrap Documentation](https://mailtrap.io/documentation)
- [SendGrid Documentation](https://sendgrid.com/docs)
- [Email Authentication (SPF/DKIM/DMARC)](https://mailtrap.io/blog/spf-dkim-dmarc/)
