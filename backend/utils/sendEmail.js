import { Resend } from "resend";

export const sendOtpEmail = async (toEmail, otp) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: "TyreFusion <no-reply@tyrefusion.in>",
    to: toEmail,
    subject: "Your TyreFusion OTP",
    html: `
      <h2>TyreFusion Login OTP</h2>
      <h1>${otp}</h1>
      <p>This OTP is valid for 5 minutes.</p>
    `,
  });
};
