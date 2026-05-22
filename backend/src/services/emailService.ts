import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
  const { error } = await resend.emails.send({
    from: 'VedaAI <onboarding@resend.dev>',
    to: email,
    subject: 'Your VedaAI Verification Code',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: auto; background: #0f172a; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 28px; letter-spacing: -0.5px;">VedaAI</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">AI Assessment Creator</p>
        </div>
        <div style="padding: 40px 32px; background: #1e293b;">
          <p style="color: #94a3b8; font-size: 15px; margin: 0 0 24px;">Hi there! Use the verification code below to complete your signup.</p>
          <div style="background: #0f172a; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px; border: 1px solid #334155;">
            <span style="font-size: 40px; font-weight: 700; letter-spacing: 10px; color: #a78bfa;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 13px; margin: 0; text-align: center;">
            This code expires in <strong style="color: #94a3b8;">10 minutes</strong>. Do not share it with anyone.
          </p>
        </div>
        <div style="padding: 16px 32px; background: #0f172a; text-align: center;">
          <p style="color: #475569; font-size: 12px; margin: 0;">© 2026 VedaAI. All rights reserved.</p>
        </div>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};
