## Vrisa — End-to-End Encrypted Chat

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

### 🚨 Important
- Change `NEXTAUTH_SECRET` in production (use `openssl rand -base64 32`)
- Use environment-specific database URLs
- Never commit `.env` files to version control
