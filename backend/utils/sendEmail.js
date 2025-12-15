import nodemailer from "nodemailer";

export const sendOtpEmail = async (toEmail, otp) => {
  // ✅ Create transporter INSIDE function (after dotenv is loaded)
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"TyreFusion" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your TyreFusion OTP",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>TyreFusion Login OTP</h2>
        <p>Your OTP is:</p>
        <h1 style="letter-spacing: 4px;">${otp}</h1>
        <p>This OTP is valid for <strong>5 minutes</strong>.</p>
        <p>If you did not request this, please ignore.</p>
      </div>
    `,
  });
};
