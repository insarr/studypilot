import nodemailer, { type TestAccount } from 'nodemailer';

export interface MailResult {
  sent: boolean;
  mode: 'smtp' | 'ethereal' | 'demo';
  previewUrl?: string;
}

let etherealAccountPromise: Promise<TestAccount | null> | null = null;

async function getEtherealAccount(): Promise<TestAccount | null> {
  if (!etherealAccountPromise) {
    etherealAccountPromise = nodemailer.createTestAccount().catch(() => null);
  }
  return etherealAccountPromise;
}

export async function sendVerificationEmail(to: string, name: string, code: string): Promise<MailResult> {
  const subject = `Код подтверждения StudyPilot: ${code}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #fffdf9; border: 1px solid #e6e4dd; border-radius: 24px; color: #030302;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="display: inline-block; padding: 6px 14px; border-radius: 999px; background: #fde99b; font-weight: 700; font-size: 13px;">StudyPilot AI · Верификация</span>
      </div>
      <h2 style="font-size: 24px; margin: 0 0 12px; text-align: center;">Привет, ${name}! 🦊</h2>
      <p style="font-size: 15px; line-height: 1.55; color: #41413f; text-align: center; margin: 0 0 24px;">
        Используйте этот 6-значный код для подтверждения вашей почты в StudyPilot. Код действителен в течение 15 минут:
      </p>
      <div style="background: #030302; color: #fde99b; font-size: 32px; font-weight: 800; letter-spacing: 10px; text-align: center; padding: 18px 24px; border-radius: 18px; margin: 0 auto 24px; max-width: 280px;">
        ${code}
      </div>
      <p style="font-size: 12px; color: #787774; text-align: center; margin: 0;">
        Если вы не запрашивали этот код, просто проигнорируйте письмо.
      </p>
    </div>
  `;

  // 1. If real SMTP credentials are configured in .env (Gmail, Yandex, Resend, Mailgun, etc.)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 465),
        secure: Number(process.env.SMTP_PORT || 465) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"StudyPilot AI" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
      return { sent: true, mode: 'smtp' };
    } catch (e) {
      console.error('[Mail] Real SMTP failed, falling back to Ethereal/Demo:', e);
    }
  }

  // 2. Try Ethereal Email (real previewable email inbox in browser without any configuration)
  try {
    const testAcc = await getEtherealAccount();
    if (testAcc) {
      const transporter = nodemailer.createTransport({
        host: testAcc.smtp.host,
        port: testAcc.smtp.port,
        secure: testAcc.smtp.secure,
        auth: {
          user: testAcc.user,
          pass: testAcc.pass,
        },
      });
      const info = await transporter.sendMail({
        from: '"StudyPilot AI" <no-reply@studypilot.app>',
        to,
        subject,
        html,
      });
      const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
      console.log(`[Mail] Verification code for ${to}: ${code} | Preview: ${previewUrl}`);
      return { sent: true, mode: 'ethereal', previewUrl };
    }
  } catch {
    // ignore and fall back to demo
  }

  console.log(`[Mail Demo] Verification code for ${to}: ${code}`);
  return { sent: false, mode: 'demo' };
}
