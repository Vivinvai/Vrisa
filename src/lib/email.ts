import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendOTPEmail(to: string, otp: string, name?: string) {
  const displayName = name || to.split("@")[0];

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: "Verify Your Email - Vrisa Secure Chat",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            .header {
              background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
              padding: 40px 20px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
              font-weight: 700;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header p {
              margin: 8px 0 0 0;
              font-size: 16px;
              opacity: 0.95;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              color: #1e293b;
              margin-bottom: 20px;
            }
            .message {
              font-size: 16px;
              color: #475569;
              line-height: 1.6;
              margin-bottom: 30px;
            }
            .otp-container {
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              border: 2px solid #06b6d4;
              border-radius: 12px;
              padding: 30px;
              text-align: center;
              margin: 30px 0;
            }
            .otp-label {
              font-size: 14px;
              color: #0e7490;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 10px;
            }
            .otp-code {
              font-size: 42px;
              font-weight: 700;
              color: #0e7490;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
              margin: 10px 0;
              text-shadow: 0 2px 4px rgba(6, 182, 212, 0.1);
            }
            .expiry {
              font-size: 13px;
              color: #64748b;
              margin-top: 15px;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .warning p {
              margin: 0;
              font-size: 14px;
              color: #92400e;
            }
            .footer {
              background: #f8fafc;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer p {
              margin: 5px 0;
              font-size: 14px;
              color: #64748b;
            }
            .footer a {
              color: #06b6d4;
              text-decoration: none;
            }
            .security-badge {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              background: #dcfce7;
              color: #166534;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 13px;
              font-weight: 600;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Vrisa</h1>
              <p>Secure End-to-End Encrypted Chat</p>
            </div>
            
            <div class="content">
              <p class="greeting">Hi ${displayName},</p>
              
              <p class="message">
                Welcome to <strong>Vrisa</strong>! We're excited to have you join our secure messaging platform. 
                To complete your registration and start chatting securely, please verify your email address.
              </p>
              
              <div class="otp-container">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code">${otp}</div>
                <p class="expiry">⏱️ This code expires in <strong>5 minutes</strong></p>
              </div>
              
              <p class="message">
                Enter this code on the verification page to activate your account and start sending 
                encrypted messages with end-to-end encryption.
              </p>
              
              <div class="warning">
                <p>
                  <strong>⚠️ Security Notice:</strong> Never share this code with anyone. 
                  Vrisa staff will never ask for your verification code.
                </p>
              </div>
              
              <div style="text-align: center;">
                <div class="security-badge">
                  <span>🔒</span>
                  <span>AES-256 Encrypted</span>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Vrisa Secure Chat</strong></p>
              <p>End-to-End Encrypted Messaging</p>
              <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">
                If you didn't request this code, please ignore this email or contact support if you're concerned.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${displayName},

Welcome to Vrisa Secure Chat!

Your verification code is: ${otp}

This code expires in 5 minutes.

Enter this code on the verification page to complete your registration.

Security Notice: Never share this code with anyone.

---
Vrisa - End-to-End Encrypted Messaging
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}
