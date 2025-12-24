import { Resend } from "resend";

export const sendUpiPendingEmail = async ({ to, order, user }) => {
  // ⚠️ Important: initialize INSIDE function
  const resend = new Resend(process.env.RESEND_API_KEY);

  const customerName =
    order?.shippingAddress?.fullName ||
    user?.name ||
    user?.email ||
    "Customer";

  await resend.emails.send({
    from: "TyreKing <orders@tyrefusion.in>",
    to,
    subject: "TyreKing – UPI Payment Pending",
    html: `
      <div style="font-family: Arial, sans-serif; color:#333;">
        <h2 style="color:#f97316;">UPI Payment Pending</h2>

        <p>Hello <b>${customerName}</b>,</p>

        <p>
          Your order <b>${order._id}</b> has been placed successfully.
        </p>

        <p>
          Please complete the payment using the <b>UPI QR code shown on the checkout page</b>.
        </p>

        <p>
          Once the payment is verified, you will receive a final order
          confirmation email.
        </p>

        <p style="margin-top:10px;">
          <b>Total Amount:</b> ₹${order.totalAmount}
        </p>

        <hr style="margin:20px 0;" />

        <p style="font-size:13px;color:#666;">
          If you have already completed the payment, please ignore this message.
        </p>

        <p style="margin-top:20px;">
          — Team <b>TyreKing</b>
        </p>
      </div>
    `,
  });
};
