import { Resend } from "resend";

export const sendOrderConfirmationEmail = async ({ to, order, user }) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const customerName =
    order?.shippingAddress?.fullName || user?.email || "Customer";

  // Build order item rows
  const itemsHtml = order.items
    .map(
      (it) => `
      <tr>
        <td>
          ${it.tyre.brand} ${it.tyre.title}<br/>
          <small>Size: ${it.tyre.size}</small>
        </td>
        <td align="center">${it.quantity}</td>
        <td align="right">₹${it.price * it.quantity}</td>
      </tr>`
    )
    .join("");

  // Subtotal (total without delivery fee)
  const subtotal =
    (order.items || []).reduce(
      (sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1),
      0
    ) || 0;

  const deliveryFee = order.deliveryFee || 0;

  await resend.emails.send({
    from: "TyreFusion <orders@tyrefusion.in>",
    to,
    subject: `TyreFusion Order Confirmation – ${order._id}`,
    html: `
      <h2>TyreFusion Order Confirmation</h2>

      <p>Hello ${customerName},</p>

      <p>Thank you for your order. Here are the details:</p>

      <table width="100%" cellspacing="0" cellpadding="6" border="1" style="border-collapse:collapse;">
        <tr>
          <th align="left">Product</th>
          <th align="center">Qty</th>
          <th align="right">Amount</th>
        </tr>
        ${itemsHtml}
      </table>

      <p>
        <b>Subtotal:</b> ₹${subtotal}<br/>
        <b>Delivery Fee:</b> ₹${deliveryFee}<br/>
        <b>Total Payable:</b> ₹${order.totalAmount}
      </p>

      <p>
        We will contact you soon regarding delivery and installation.
      </p>

      <p>
        Regards,<br/>
        TyreFusion Team
      </p>
    `,
  });
};
