# Nodemailer Setup - Quick Start Guide

Get up and running with email functionality in 5 minutes.

## Choice 1: Use Mailtrap (Easiest for Development) ⭐

### 1. Sign Up for Free Account

1. Go to https://mailtrap.io
2. Click "Sign Up"
3. Complete registration (5 minutes)

### 2. Get Your Credentials

1. Click "Email" → "Testing"
2. Select "Nodemailer" from dropdown
3. Copy these 4 values:
   - `Host`
   - `Port`
   - `Username`
   - `Password`

### 3. Update `.env`

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=xxxxx       # Copy from Mailtrap
SMTP_PASSWORD=xxxxx   # Copy from Mailtrap
SMTP_FROM=noreply@smartaccidentreport.com
FRONTEND_URL=http://localhost:3000
```

### 4. Done! 🎉

```bash
pnpm run start:dev
```

All emails will appear in Mailtrap inbox (not sent to real addresses).

---

## Choice 2: Use Gmail (5-10 minutes)

### 1. Enable 2-Step Verification

1. Go to https://myaccount.google.com/security
2. Find "2-Step Verification"
3. Enable if not already on

### 2. Create App Password

1. Go to https://myaccount.google.com/apppasswords
2. Select: Mail → Windows Computer
3. Google generates a 16-character password
4. Copy it (ignore spaces)

### 3. Update `.env`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=xxxxx-xxxxx-xxxxx-xxxxx  # The 16-char password
SMTP_FROM=noreply@smartaccidentreport.com
FRONTEND_URL=http://localhost:3000
```

### 4. Done! 🎉

```bash
pnpm run start:dev
```

Emails will send to real Gmail accounts.

---

## Test It Works

### 1. Start the Server

```bash
pnpm run start:dev
```

### 2. Register a User

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "fullName": "Test User",
    "phoneNumber": "1234567890"
  }'
```

### 3. Request Password Reset

```bash
curl -X POST http://localhost:8000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### 4. Check Email

**Mailtrap**:

- Open Mailtrap dashboard
- Check "Inbox"
- Click the email from noreply@smartaccidentreport.com

**Gmail**:

- Check Gmail inbox
- Look for "Password Reset Request" email

### 5. Extract Token from Email

Find the reset link in the email:

```
http://localhost:3000/reset-password?token=eyJhbGciOiJI...
```

Copy everything after `token=`

### 6. Reset Password

```bash
curl -X POST http://localhost:8000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJI...",
    "newPassword": "NewPassword123!",
    "confirmPassword": "NewPassword123!"
  }'
```

### 7. Check Confirmation Email

Should receive "Password Reset Successful" confirmation email.

✅ **All done!** Password reset emails are working.

---

## Troubleshooting

| Problem                          | Solution                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Email not received               | Check Mailtrap "All" folder or Gmail spam                                                                     |
| "Email configuration incomplete" | Ensure all 4 SMTP vars in .env are set                                                                        |
| "Failed to connect SMTP"         | Verify SMTP_HOST and SMTP_PORT are correct                                                                    |
| Invalid token error              | Token may have expired (1hr limit)                                                                            |
| Gmail blocking access            | Check if logged in, enable "Less secure app access" [here](https://support.google.com/accounts/answer/185833) |

---

## For Full Documentation

See:

- `EMAIL_CONFIGURATION.md` - Complete setup guide
- `NODEMAILER_TESTING.md` - Detailed testing procedures
- `NODEMAILER_IMPLEMENTATION_SUMMARY.md` - Technical details

---

## Next Steps

- ✅ Emails configured and working
- Optional: Add welcome emails for new users
- Optional: Add accident alert emails
- Optional: Add dispatcher notifications
- Optional: Set up SendGrid for production

Ready to move forward? Check the full documentation files!
