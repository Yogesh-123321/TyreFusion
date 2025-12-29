import { Resend } from "resend";

export const sendOrderConfirmationEmail = async ({ to, order, user }) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const customerName =
    order?.shippingAddress?.fullName || user?.email || "Customer";

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

  await resend.emails.send({
    from: "TyreFusion <orders@tyrefusion.in>",
    to,
    subject: `TyreFusion Order Confirmation – ${order._id}`,
    html: `
      <h2>TyreFusion Order Confirmation</h2>
      <p>Hello ${customerName},</p>
      <table width="100%">${itemsHtml}</table>
      <p><b>Total:</b> ₹${order.totalAmount}</p>
    `,
  });
};
