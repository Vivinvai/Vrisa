# 📧 OTP Email Verification - Setup Complete!

## ✅ What's Been Implemented:

### 1. **Database Schema**
- Added `emailVerified` field to User model
- Created `OtpCode` table for storing verification codes
- OTPs are hashed for security
- Automatic expiration after 5 minutes

### 2. **Email Service**
- Professional HTML email template with Vrisa branding
- 6-digit OTP codes
- Gradient design matching the app
- Plain text fallback for email clients

### 3. **Registration Flow**
- Register → Generate OTP → Send Email → Verify → Login
- User gets redirected to verification page after registration
- Can't login until email is verified

### 4. **OTP Verification Page** (`/verify-otp`)
- Clean UI with animated background
- 6-digit code input
- Resend button with 60-second cooldown
- Auto-redirect to login after successful verification

### 5. **Security Features**
- OTPs hashed in database (bcrypt)
- 5-minute expiration
- One-time use only
- Rate limiting on resend (60 seconds)
- Blocks unverified users from logging in

## 🚨 IMPORTANT: Gmail Setup Required!

Your credentials are currently set as:
```
Email: vrisa.encryption@gmail.com
Password: Pokemon9876
```

**This won't work yet!** You need to generate a **Google App Password**:

### Steps to Get App Password:

1. **Go to your Google Account:** https://myaccount.google.com/security

2. **Enable 2-Step Verification:**
   - Click "2-Step Verification"
   - Follow the setup process
   - This is REQUIRED for app passwords

3. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other" (type "Vrisa")
   - Click "Generate"
   - You'll get a 16-character code like: `abcd efgh ijkl mnop`

4. **Update `.env` file:**
   ```env
   EMAIL_PASSWORD="abcdefghijklmnop"
   ```
   (Remove spaces from the app password)

5. **Restart the dev server:**
   ```bash
   npm run dev
   ```

## 🎯 Testing the Flow:

1. **Register a new account:**
   - Go to http://localhost:3000/register
   - Fill in name, email, password
   - Click "Create Account"

2. **Check your email:**
   - You should receive an email with a 6-digit code
   - Code expires in 5 minutes

3. **Verify OTP:**
   - Enter the 6-digit code on the verification page
   - Click "Verify Email"

4. **Login:**
   - After verification, you'll be redirected to login
   - Use your email and password
   - If you try to login before verification, you'll see: "Please verify your email before logging in"

## 📝 Current Configuration:

```env
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="vrisa.encryption@gmail.com"
EMAIL_PASSWORD="Pokemon9876"  ← REPLACE WITH APP PASSWORD
EMAIL_FROM="Vrisa Secure Chat <vrisa.encryption@gmail.com>"
```

## 🔧 Troubleshooting:

### If emails aren't sending:

1. **Check console logs** - Look for email errors in terminal
2. **Verify App Password** - Make sure it's 16 characters, no spaces
3. **Check 2FA is enabled** - Required for app passwords
4. **Test with Gmail SMTP tester** - Verify credentials work

### Common Errors:

**"Invalid login: 535-5.7.8 Username and Password not accepted"**
- You're using regular password instead of app password
- Generate app password from Google Account settings

**"Connection timeout"**
- Check firewall/antivirus blocking port 587
- Try port 465 with `secure: true`

**"EAUTH: Authentication failed"**
- 2-Step Verification not enabled
- Wrong app password

## ✨ Features:

- ✅ **6-digit OTP** sent to email
- ✅ **5-minute expiration** 
- ✅ **Resend with 60s cooldown**
- ✅ **Professional email template**
- ✅ **Blocks unverified users**
- ✅ **One-time use codes**
- ✅ **Automatic cleanup**

## 🎨 Email Preview:

The email includes:
- Vrisa logo with gradient
- Welcome message
- Large 6-digit code (easy to read)
- Expiration notice
- Security warning
- Professional footer

## 📊 Database Structure:

```prisma
model User {
  emailVerified Boolean @default(false)
  otpCodes      OtpCode[]
  // ... other fields
}

model OtpCode {
  id        String   @id
  userId    String
  code      String   @db.VarChar(255) // Hashed
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now)
}
```

## 🚀 Next Steps:

1. **Get your App Password** from Google (see steps above)
2. **Update `.env`** with the app password
3. **Restart server:** `npm run dev`
4. **Test registration** with your real email
5. **Check if email arrives** (check spam folder too!)

---

**Status:** ✅ Code implemented, waiting for App Password to test emails!
