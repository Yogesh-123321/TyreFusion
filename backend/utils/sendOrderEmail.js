import { Resend } from "resend";
import QRCode from "qrcode";

let resendClient = null;

/**
 * Lazily initialize Resend AFTER dotenv is loaded
 */
const getResendClient = () => {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is missing from environment");
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

export const sendOrderConfirmationEmail = async ({ to, order, user }) => {
  try {
    const resend = getResendClient();

    const customerName =
      order?.shippingAddress?.fullName ||
      user?.email ||
      "Customer";

    /* ---------------- ORDER ITEMS ---------------- */
    const itemsHtml = order.items
      .map(
        (it) => `
        <tr>
          <td style="padding:6px 0;">
            ${it.tyre.brand} ${it.tyre.title}<br/>
            <small>Size: ${it.tyre.size}</small>
          </td>
          <td align="center">${it.quantity}</td>
          <td align="right">₹${it.price * it.quantity}</td>
        </tr>
      `
      )
      .join("");

    /* ---------------- UPI QR ---------------- */
    let upiSectionHtml = "";

    if (order.paymentMode === "UPI") {
      const upiId = process.env.UPI_ID;
      const amount = order.totalAmount;

      const upiString = `upi://pay?pa=${upiId}&pn=TyreFusion&am=${amount}&cu=INR`;
      const qrBase64 = await QRCode.toDataURL(upiString);

      upiSectionHtml = `
        <hr style="margin:20px 0;" />
        <h3>💳 UPI Payment</h3>
        <p>Please scan the QR code below to pay <b>₹${amount}</b></p>
        <p><b>UPI ID:</b> ${upiId}</p>
        <img src="${qrBase64}" style="width:220px;height:220px;" />
      `;
    }

    /* ---------------- EMAIL HTML ---------------- */
    const html = `
      <div style="font-family:Arial,sans-serif;color:#333;">
        <h2>🛞 TyreFusion Order Confirmation</h2>

        <p>Hello <b>${customerName}</b>,</p>

        <p>
          <b>Order ID:</b> ${order._id}<br/>
          <b>Payment Mode:</b> ${order.paymentMode}<br/>
          <b>Payment Status:</b> ${order.paymentStatus}
        </p>

        <table width="100%">
          <thead>
            <tr>
              <th align="left">Item</th>
              <th align="center">Qty</th>
              <th align="right">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <p><b>Total:</b> ₹${order.totalAmount}</p>

        ${upiSectionHtml}

        <hr/>
        <p>
          ${order.shippingAddress.fullName}<br/>
          ${order.shippingAddress.address}<br/>
          ${order.shippingAddress.city}, ${order.shippingAddress.state} -
          ${order.shippingAddress.pincode}<br/>
          Phone: ${order.shippingAddress.phone}
        </p>

        <p>— Team TyreFusion</p>
      </div>
    `;

    await resend.emails.send({
      from: "TyreFusion <onboarding@resend.dev>",
      to,
      subject: `TyreFusion Order Confirmation – ${order._id}`,
      html,
    });

    console.log("✅ Order confirmation email sent via Resend");
  } catch (err) {
    console.error("❌ Order email failed:", err);
  }
};
