import { Resend } from "resend";

let resendClient = null;

const getResendClient = () => {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is missing from environment");
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

export const sendOtpEmail = async (toEmail, otp) => {
  try {
    const resend = getResendClient();

    await resend.emails.send({
      from: "TyreFusion <onboarding@resend.dev>",
      to: toEmail,
      subject: "Your TyreFusion OTP",
      html: `
        <div style="font-family:Arial,sans-serif;">
          <h2>TyreFusion Login OTP</h2>
          <p>Your OTP is:</p>
          <h1 style="letter-spacing:4px;">${otp}</h1>
          <p>This OTP is valid for <b>5 minutes</b>.</p>
          <p>If you did not request this, please ignore.</p>
        </div>
      `,
    });

    console.log("✅ OTP email sent via Resend");
  } catch (err) {
    console.error("❌ OTP email failed:", err);
    throw err;
  }
};
