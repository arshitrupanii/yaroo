import nodemailer from 'nodemailer';

const emailProvider = () => process.env.EMAIL_PROVIDER?.trim().toLowerCase();

const senderAddress = () => (
  process.env.EMAIL_FROM ||
  process.env.RESEND_FROM ||
  process.env.SMTP_FROM ||
  process.env.SMTP_USER ||
  'Yaroo <onboarding@resend.dev>'
);

const hasSmtpConfig = () => (
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

const hasResendConfig = () => Boolean(process.env.RESEND_API_KEY?.trim());

const passwordResetEmail = (resetUrl) => ({
  subject: 'Reset your Yaroo password',
  text: `Use this link to reset your password: ${resetUrl}`,
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <h2 style="margin-bottom: 8px;">Reset your Yaroo password</h2>
      <p>Use the button below to reset your password. This link expires soon.</p>
      <p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 16px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px;">
          Reset password
        </a>
      </p>
      <p style="font-size: 13px; color: #555;">If the button does not work, copy this link:</p>
      <p style="font-size: 13px; word-break: break-all;">${resetUrl}</p>
    </div>
  `
});

const sendWithResend = async ({ to, resetUrl }) => {
  const email = passwordResetEmail(resetUrl);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: senderAddress(),
      to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend email failed with status ${response.status}: ${errorBody.slice(0, 300)}`);
  }
};

const sendWithSmtp = async ({ to, resetUrl }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: senderAddress(),
    to,
    ...passwordResetEmail(resetUrl),
  });
};

export const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  const provider = emailProvider();

  if ((provider === 'resend' || (!provider && hasResendConfig())) && hasResendConfig()) {
    await sendWithResend({ to, resetUrl });
    return { skipped: false, provider: 'resend' };
  }

  if ((provider === 'smtp' || !provider) && hasSmtpConfig()) {
    await sendWithSmtp({ to, resetUrl });
    return { skipped: false, provider: 'smtp' };
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log("Password reset URL:", resetUrl);
    return { skipped: true };
  }

  throw new Error('Email provider is not configured');
};
