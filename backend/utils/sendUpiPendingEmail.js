import { Resend } from "resend";

export const sendUpiPendingEmail = async ({ to, order, user }) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const customerName =
    order?.shippingAddress?.fullName ||
    user?.name ||
    user?.email ||
    "Customer";

  // Calculate subtotal
  const subtotal =
    (order.items || []).reduce(
      (sum, it) =>
        sum +
        Number(it.price || 0) * Number(it.quantity || 1),
      0
    ) || 0;

  const deliveryFee = order.deliveryFee || 0;

  await resend.emails.send({
    from: "TyreFusion <orders@tyrefusion.in>",
    to,
    subject: "TyreFusion – UPI Payment Pending",
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
          Once the payment is verified, you will receive a final order confirmation email.
        </p>

        <p style="margin-top:15px;">
          <b>Subtotal:</b> ₹${subtotal}<br/>
          <b>Delivery Fee:</b> ₹${deliveryFee}<br/>
          <b>Total Payable:</b> ₹${order.totalAmount}
        </p>

        <hr style="margin:20px 0;" />

        <p style="font-size:13px;color:#666;">
          If you have already completed the payment, please ignore this message.
        </p>

        <p style="margin-top:20px;">
          — Team <b>TyreFusion</b>
        </p>
      </div>
    `,
  });
};
