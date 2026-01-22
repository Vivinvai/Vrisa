# GitHub Setup Instructions

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right, select "New repository"
3. Name it: **Vrisa**
4. Description: "End-to-end encrypted chat application with Next.js, Prisma, and PostgreSQL"
5. Keep it **Public** (or Private if you prefer)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Step 2: Connect Local Repository to GitHub

After creating the repository, run these commands in your terminal:

```bash
# Add your GitHub repository as remote (replace YOUR_USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/Vrisa.git

# Or if you prefer SSH:
# git remote add origin git@github.com:YOUR_USERNAME/Vrisa.git

# Push your code to GitHub
git push -u origin main
```

## Step 3: Verify Upload

1. Refresh your GitHub repository page
2. You should see all your project files
3. Check that `.env` is NOT visible (it's in `.gitignore`)

---

## Quick Deploy to Vercel (Free)

### Option 1: One-Click Deploy via Vercel Dashboard

1. **Visit [Vercel](https://vercel.com/new)**
2. **Import Git Repository**
   - Sign in with GitHub
   - Select your "Vrisa" repository
3. **Configure Project**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. **Add Environment Variables** (click "Add" for each):
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/db
   NEXTAUTH_SECRET=your-generated-secret
   NEXTAUTH_URL=https://your-app.vercel.app
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=Vrisa <your-email@gmail.com>
   ```
5. **Click "Deploy"**
6. **Wait 2-3 minutes** for deployment to complete

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# For production deployment
vercel --prod
```

---

## Free Database Setup (Choose One)

### 🟢 Neon (Recommended)
```bash
1. Go to https://neon.tech
2. Sign up (free, no credit card)
3. Create new project → Copy connection string
4. Add to Vercel env vars as DATABASE_URL
```

### 🔵 Supabase
```bash
1. Go to https://supabase.com
2. Create project → Settings → Database
3. Copy "Connection pooling" string
4. Add to Vercel env vars as DATABASE_URL
```

### 🟣 Railway
```bash
1. Go to https://railway.app
2. New Project → Provision PostgreSQL
3. Copy DATABASE_URL from variables tab
4. Add to Vercel env vars
```

---

## Generate NEXTAUTH_SECRET

Run one of these commands:

```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Copy the output and add it as `NEXTAUTH_SECRET` in Vercel.

---

## Gmail App Password (for OTP emails)

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (if not already enabled)
3. Go to **App Passwords** section
4. Generate new app password for "Mail"
5. Copy the 16-character password (no spaces)
6. Add to Vercel as `EMAIL_PASS`

---

## Post-Deployment: Run Database Migration

After deploying to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.production

# Run Prisma migration
npx prisma db push
```

Or use Vercel's dashboard:
1. Go to your project in Vercel
2. Settings → General → Build & Development Settings
3. Add "Build Command": `npx prisma generate && npm run build`

---

## 🎉 You're Done!

Your app is now live at: `https://your-app-name.vercel.app`

Test it:
- ✅ Register a new account
- ✅ Verify email (check spam folder if needed)
- ✅ Login and start chatting
- ✅ Test themes (Dark, Blue, Light)
- ✅ Send encrypted messages

---

## Continuous Deployment

Every time you push to GitHub:
```bash
git add .
git commit -m "Your changes"
git push
```
Vercel will automatically deploy the updates!

---

## Troubleshooting

**Build fails?**
- Check Vercel build logs
- Ensure all env vars are set
- Try `npm run build` locally first

**Database errors?**
- Verify DATABASE_URL format
- Check if database is accessible
- Run `npx prisma db push` manually

**Email not sending?**
- Verify Gmail App Password (16 chars, no spaces)
- Check 2FA is enabled
- Try different SMTP provider

---

## Need Help?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.
