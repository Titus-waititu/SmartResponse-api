# Testing the Nodemailer Integration

This guide will help you test the password reset email functionality end-to-end.

## Prerequisites

1. **Configure Email Credentials** in `.env`:

   ```env
   SMTP_HOST=smtp.mailtrap.io          # or smtp.gmail.com
   SMTP_PORT=2525                      # or 587 for Gmail
   SMTP_USER=your-mailtrap-user        # or your-email@gmail.com
   SMTP_PASSWORD=your-mailtrap-password # or app-password
   SMTP_FROM=noreply@smartaccidentreport.com
   FRONTEND_URL=http://localhost:3000
   ```

2. **Start the Application**:

   ```bash
   pnpm run start:dev
   ```

3. **Mailtrap Account** (for development testing):
   - Free account at https://mailtrap.io
   - All emails captured in inbox (not sent)
   - Perfect for development/testing

## Test Flow 1: Password Reset Request

### Step 1: Create a User Account

First, register a user if you don't have one:

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Password123!",
    "fullName": "Test User",
    "phoneNumber": "1234567890"
  }'
```

### Step 2: Request Password Reset

Send a "forgot password" request:

```bash
curl -X POST http://localhost:8000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com"
  }'
```

**Expected Response**:

```json
{
  "message": "Password reset email sent successfully"
}
```

### Step 3: Check Email

**If using Mailtrap**:

1. Log in to Mailtrap dashboard
2. Go to Email -> Testing
3. Check "Inbox" tab
4. Click the latest email from noreply@smartaccidentreport.com
5. Copy the reset token from the email (or click the link)

**If using Gmail**:

1. Check your Gmail inbox
2. Find email from noreply@smartaccidentreport.com
3. Click the reset password link in the email

### Step 4: Extract Reset Token

If using the CLI, extract the token from the reset link:

```
http://localhost:3000/reset-password?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Copy the token value (everything after `token=`)

## Test Flow 2: Reset Password

### Step 1: Call Reset Password Endpoint

```bash
curl -X POST http://localhost:8000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "newPassword": "NewPassword123!",
    "confirmPassword": "NewPassword123!"
  }'
```

**Expected Response**:

```json
{
  "message": "Password has been reset successfully"
}
```

### Step 2: Verify Success Email

Check your email again (Mailtrap or Gmail):

- You should receive a "Password Reset Successful" confirmation email
- Email shows password was changed
- Contains security notification

### Step 3: Login with New Password

Test that the new password works:

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "NewPassword123!"
  }'
```

Should return access token and user info.

## Troubleshooting

### Email Not Received

1. **Check Logs**:

   ```bash
   # Look for MailService logs
   tail -f logs/app.log | grep -i mail
   ```

2. **Verify SMTP Configuration**:

   ```bash
   # Check .env file
   echo $SMTP_HOST
   echo $SMTP_PORT
   echo $SMTP_USER
   ```

3. **Test Connection**:
   ```bash
   curl -X GET http://localhost:8000/api/v1/mail/test \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Common Issues

| Issue                            | Solution                                          |
| -------------------------------- | ------------------------------------------------- |
| "Email configuration incomplete" | Check all SMTP variables in .env                  |
| "Failed to connect to SMTP"      | Verify SMTP credentials and port                  |
| Email in spam folder             | Add `noreply@smartaccidentreport.com` to contacts |
| Invalid token error              | Token may have expired (1 hour expiration)        |
| Emails not in Mailtrap           | Check "Trash" folder in Mailtrap dashboard        |

## Email Templates

### Password Reset Email

**Subject**: Password Reset Request - Smart Accident Report System

**Contains**:

- Professional header with system branding
- Clear reset instructions
- Clickable reset button
- Backup link for manual entry
- Security warning
- 1-hour token expiration notice

### Password Reset Success Email

**Subject**: Password Reset Successful - Smart Accident Report System

**Contains**:

- Confirmation of successful password change
- Security reassurance notification
- System branding and footer

## Performance Considerations

- Email sending is **asynchronous** but awaited in the auth flow
- If email fails, user gets error message (password not changed)
- Emails are logged with Message IDs for tracking
- Failed emails are logged for debugging

## Production Testing

Before deploying to production:

1. **Switch to SendGrid** (professional SMTP service)
2. **Set up SPF/DKIM/DMARC** records for domain
3. **Configure sender verification** in email provider
4. **Monitor deliverability** metrics
5. **Test spam filters** with real email account
6. **Load test** email sending with multiple users

## Additional Testing Commands

### Test with Different Users

```bash
# User 1
curl -X POST http://localhost:8000/api/v1/auth/forgot-password \
  -d '{"email": "user1@test.com"}' -H "Content-Type: application/json"

# User 2
curl -X POST http://localhost:8000/api/v1/auth/forgot-password \
  -d '{"email": "user2@test.com"}' -H "Content-Type: application/json"
```

### Test Email Edge Cases

```bash
# Non-existent user (should return error)
curl -X POST http://localhost:8000/api/v1/auth/forgot-password \
  -d '{"email": "nonexistent@test.com"}' \
  -H "Content-Type: application/json"

# Invalid token (should return error)
curl -X POST http://localhost:8000/api/v1/auth/reset-password \
  -d '{
    "token": "invalid-token-123",
    "newPassword": "NewPass123!",
    "confirmPassword": "NewPass123!"
  }' -H "Content-Type: application/json"

# Mismatched passwords (should return error)
curl -X POST http://localhost:8000/api/v1/auth/reset-password \
  -d '{
    "token": "valid-token",
    "newPassword": "NewPass123!",
    "confirmPassword": "DifferentPass456!"
  }' -H "Content-Type: application/json"
```

## Monitoring in Production

### Application Logs

```bash
# Monitor email service activities
grep "MailService" app.log
grep "Password reset" app.log
```

### Email Provider Metrics

- **SendGrid**: Check delivery dashboard
- **Mailgun**: Monitor bounce rates and spam complaints
- **AWS SES**: Review CloudWatch metrics

### User Feedback

- Monitor password reset success/failure rates
- Track email bounce complaints
- Collect user feedback on email clarity
