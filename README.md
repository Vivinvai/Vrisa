# Vrisa — End-to-End Encrypted Chat

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/Vrisa)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.4-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)

Modern real-time encrypted messaging platform with email authentication. Messages are encrypted client-side with AES-256-GCM; encryption keys are automatically generated and secured with your password.

### 🔐 Features
- **Email authentication** with automatic key generation
- **End-to-end encryption** (AES-256-GCM + RSA-4096)
- **Real-time messaging** with auto-refresh every 3 seconds
- **Clean, modern UI** - encryption happens automatically in the background
- **Multi-user support** - chat with anyone registered on the platform
- **Password-protected keys** - your private keys never leave your device in plain form

### 🚀 Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
# Update .env with your PostgreSQL credentials
DATABASE_URL="postgresql://user:password@localhost:5432/vrisa?schema=public"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

3. **Initialize database:**
```bash
npm run prisma:generate
npm run prisma:push
```

4. **Start the app:**
```bash
npm run dev
# Open http://localhost:3000
```

### 📖 How It Works

1. **Register** with your email and password
   - RSA-4096 keypair is automatically generated
   - Private key is encrypted with your password and stored securely
   - Public key is stored for other users to encrypt messages to you

2. **Login** and unlock your keys with your password
   - Your encrypted private key is decrypted client-side
   - AES-256 session key is generated for each chat

3. **Send messages**
   - Messages are encrypted with AES-256-GCM before sending
   - Only ciphertext + IV reach the server
   - Recipients decrypt using their own keys

4. **Receive messages**
   - Messages auto-refresh every 3 seconds
   - Decryption happens automatically in the background
   - Server never sees plaintext

### 🛠 Tech Stack
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Auth:** NextAuth.js v5 (credentials provider)
- **Encryption:** Web Crypto API (AES-GCM, RSA-OAEP, PBKDF2)

### 📁 Project Structure
```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/        # NextAuth endpoints
│   │   ├── register/    # User registration
│   │   ├── messages/    # Message CRUD
│   │   └── users/       # User list
│   ├── chat/            # Main chat interface
│   ├── login/           # Login page
│   └── register/        # Registration page
├── lib/
│   ├── auth/            # NextAuth configuration
│   ├── crypto.ts        # Encryption utilities
│   └── prisma.ts        # Database client
└── types/               # TypeScript definitions

prisma/
└── schema.prisma        # Database schema (User, Message models)
```

### 🔑 Security Notes
- **Private keys never leave your device unencrypted**
- **Server only stores encrypted private keys and ciphertext**
- **Password is hashed with bcrypt (12 rounds)**
- **Session keys are ephemeral (generated per chat)**
- **PBKDF2 with 310,000 iterations for key derivation**

### 🧪 Testing
1. Register two users (e.g., alice@test.com, bob@test.com)
2. Login as alice, select bob from contacts
3. Send encrypted messages back and forth
4. Messages decrypt automatically in real-time

### 📝 Scripts
- `npm run dev` — start development server
- `npm run build` — production build
- `npm start` — serve production build
- `npm run prisma:generate` — regenerate Prisma client
- `npm run prisma:push` — sync schema to database

---

## 🚀 Deploy to Production (Free)

### Quick Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/Vrisa.git
   git push -u origin main
   ```

2. **Deploy via Vercel**:
   - Visit [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Add environment variables (see below)
   - Click Deploy

3. **Free Database Options**:
   - [Neon](https://neon.tech) - 10GB free PostgreSQL
   - [Supabase](https://supabase.com) - 500MB free PostgreSQL
   - [Railway](https://railway.app) - $5 free credit/month

4. **Environment Variables** (add in Vercel dashboard):
   ```env
   DATABASE_URL=your_postgres_connection_string
   NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
   NEXTAUTH_URL=https://your-app.vercel.app
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-gmail-app-password
   EMAIL_FROM=Vrisa <your-email@gmail.com>
   ```

**Detailed Instructions**: See [GITHUB_SETUP.md](./GITHUB_SETUP.md) and [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📦 Project Structure

```
Vrisa/
├── src/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── chat/         # Main chat interface
│   │   ├── profile/      # User profile & themes
│   │   ├── login/        # Authentication
│   │   └── register/     # User registration
│   ├── components/       # React components
│   └── lib/              # Utilities & crypto
├── prisma/
│   └── schema.prisma     # Database schema
├── public/               # Static assets
└── .env.example          # Environment template
```

---

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a PR.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/), [Prisma](https://www.prisma.io/), and [NextAuth.js](https://next-auth.js.org/)
- Encryption powered by Web Crypto API
- UI styled with [Tailwind CSS](https://tailwindcss.com/)

---

**Made with ❤️ for privacy-conscious communication**


### 🚨 Important
- Change `NEXTAUTH_SECRET` in production (use `openssl rand -base64 32`)
- Use environment-specific database URLs
- Never commit `.env` files to version control
