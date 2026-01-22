# Vrisa - Deployment Guide

This guide will help you deploy Vrisa to production for **free** using Vercel and a PostgreSQL database.

## Prerequisites

- GitHub account
- Vercel account (free tier)
- PostgreSQL database (we'll use free options)

---

## 🚀 Quick Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub** (if you haven't already):
   ```bash
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

2. **Go to [Vercel](https://vercel.com)** and sign in with GitHub

3. **Click "Add New Project"**

4. **Import your Vrisa repository**

5. **Configure Environment Variables** in Vercel:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `NEXTAUTH_SECRET` - Generate using: `openssl rand -base64 32`
   - `NEXTAUTH_URL` - Your Vercel deployment URL (e.g., `https://vrisa.vercel.app`)
   - `EMAIL_HOST` - SMTP server (e.g., `smtp.gmail.com`)
   - `EMAIL_PORT` - SMTP port (e.g., `587`)
   - `EMAIL_USER` - Your email address
   - `EMAIL_PASS` - Your email app password
   - `EMAIL_FROM` - Sender email format (e.g., `Vrisa <noreply@yourapp.com>`)

6. **Click "Deploy"**

7. **After deployment, run database migration**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Link your project
   vercel link
   
   # Run Prisma migration
   vercel env pull .env.local
   npx prisma db push
   ```

---

## 💾 Free PostgreSQL Database Options

### Option 1: Neon (Recommended)
- **Website**: [neon.tech](https://neon.tech)
- **Free Tier**: 10GB storage, 100 compute hours/month
- **Setup**:
  1. Create account at neon.tech
  2. Create new project
  3. Copy connection string
  4. Add to Vercel environment variables as `DATABASE_URL`

### Option 2: Supabase
- **Website**: [supabase.com](https://supabase.com)
- **Free Tier**: 500MB database, unlimited API requests
- **Setup**:
  1. Create project at supabase.com
  2. Go to Settings > Database
  3. Copy connection string (use "Connection pooling" for better performance)
  4. Add to Vercel as `DATABASE_URL`

### Option 3: Railway
- **Website**: [railway.app](https://railway.app)
- **Free Tier**: $5 credit/month
- **Setup**:
  1. Create account at railway.app
  2. New Project > Provision PostgreSQL
  3. Copy `DATABASE_URL` from variables
  4. Add to Vercel environment variables

---

## 📧 Email Configuration (for OTP)

### Gmail Setup
1. Enable 2-Factor Authentication on your Google account
2. Generate App Password:
   - Go to Google Account > Security > 2-Step Verification > App Passwords
   - Create new app password for "Mail"
   - Use this password as `EMAIL_PASS` in Vercel

### Vercel Environment Variables:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM=Vrisa <your-email@gmail.com>
```

---

## 🔐 Generate NEXTAUTH_SECRET

Run this command locally and copy the output:
```bash
openssl rand -base64 32
```

Or use Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🔄 Automatic Deployments

Once connected to GitHub, Vercel will automatically:
- Deploy every push to `main` branch
- Create preview deployments for pull requests
- Run build checks before deployment

---

## ✅ Post-Deployment Checklist

1. **Test registration**: Create a new account
2. **Verify OTP email**: Check if verification emails are sent
3. **Test chat functionality**: Send messages between users
4. **Check themes**: Switch between Dark, Blue, and Light modes
5. **Mobile responsiveness**: Test on mobile devices

---

## 🛠️ Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure all environment variables are set
- Verify `DATABASE_URL` is correct

### Database Connection Errors
- Whitelist Vercel IPs in your database provider (usually automatic)
- Use connection pooling URL for better performance
- Check if database is active (some free tiers sleep after inactivity)

### Email Not Sending
- Verify Gmail App Password is correct (16 characters, no spaces)
- Check if 2FA is enabled on Google account
- Try using a different SMTP provider (SendGrid, Mailgun free tiers)

### Authentication Issues
- Ensure `NEXTAUTH_URL` matches your deployment URL
- Regenerate `NEXTAUTH_SECRET` if needed
- Clear browser cookies and try again

---

## 📊 Monitoring (Free Options)

- **Vercel Analytics**: Built-in, free on hobby plan
- **Vercel Logs**: Real-time function logs
- **Sentry** (optional): Error tracking (free tier available)

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** to GitHub (already in `.gitignore`)
2. **Rotate secrets regularly** (database passwords, auth secrets)
3. **Use environment variables** for all sensitive data
4. **Enable Vercel security headers** in `next.config.js`
5. **Keep dependencies updated**: Run `npm audit` regularly

---

## 💰 Cost Breakdown

| Service | Free Tier | Upgrade Cost |
|---------|-----------|--------------|
| Vercel | 100GB bandwidth, unlimited deployments | $20/month Pro |
| Neon DB | 10GB storage | $19/month |
| Supabase | 500MB, unlimited requests | $25/month |
| Railway | $5 credit/month | Pay as you go |

**Total Monthly Cost (Free):** $0
**Expected cost at scale:** ~$20-45/month for serious usage

---

## 🚀 Next Steps

1. **Custom Domain**: Add your own domain in Vercel (free SSL included)
2. **CDN**: Vercel automatically uses their global CDN
3. **Analytics**: Enable Vercel Analytics for visitor insights
4. **Monitoring**: Set up Vercel log alerts for errors
5. **Backup**: Configure automatic database backups with your DB provider

---

## 📞 Support

For issues or questions:
- Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
- Prisma docs: [prisma.io/docs](https://www.prisma.io/docs)
- NextAuth docs: [next-auth.js.org](https://next-auth.js.org)

---

**Happy Deploying! 🎉**
