import nodemailer from "nodemailer";
import QRCode from "qrcode";

/**
 * Sends order confirmation email.
 * UPI orders include a QR code embedded via CID (email-safe).
 */
export const sendOrderConfirmationEmail = async ({ to, order, user }) => {
  /* -------------------- TRANSPORTER -------------------- */
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  /* -------------------- CUSTOMER NAME -------------------- */
  const customerName =
    order?.shippingAddress?.fullName ||
    user?.email ||
    "Customer";

  /* -------------------- ORDER ITEMS -------------------- */
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

  /* -------------------- UPI QR GENERATION -------------------- */
  let attachments = [];
  let upiSectionHtml = "";

  if (order.paymentMode === "UPI") {
    const upiId = process.env.UPI_ID; // e.g. tyrefusion@upi
    const payeeName = "TyreFusion";
    const amount = order.totalAmount;

    const upiString = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${amount}&cu=INR`;

    // Generate QR as PNG BUFFER
    const qrBuffer = await QRCode.toBuffer(upiString);

    attachments.push({
      filename: "upi-qr.png",
      content: qrBuffer,
      cid: "upi_qr_code", // 🔑 referenced in HTML
    });

    upiSectionHtml = `
      <hr style="margin:20px 0;" />

      <h3>💳 UPI Payment</h3>

      <p>
        Please scan the QR code below and pay
        <b>₹${amount}</b>.
      </p>

      <p><b>UPI ID:</b> ${upiId}</p>

      <img
        src="cid:upi_qr_code"
        alt="UPI QR Code"
        style="width:220px;height:220px;margin-top:10px;"
      />

      <p style="margin-top:10px;color:#555;">
        After payment, our team will manually verify
        and update your order status.
      </p>
    `;
  }

  /* -------------------- EMAIL HTML -------------------- */
  const html = `
    <div style="font-family:Arial,sans-serif;color:#333;">
      <h2>🛞 TyreFusion Order Confirmation</h2>

      <p>Hello <b>${customerName}</b>,</p>

      <p>
        Thank you for your order. Below are your details:
      </p>

      <p>
        <b>Order ID:</b> ${order._id}<br/>
        <b>Payment Mode:</b> ${order.paymentMode}<br/>
        <b>Payment Status:</b> ${order.paymentStatus}
      </p>

      <table width="100%" cellspacing="0" cellpadding="0">
        <thead>
          <tr>
            <th align="left">Item</th>
            <th align="center">Qty</th>
            <th align="right">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <p style="margin-top:10px;">
        <b>Total Amount:</b> ₹${order.totalAmount}
      </p>

      ${upiSectionHtml}

      <hr style="margin:20px 0;" />

      <h4>📦 Shipping Address</h4>
      <p>
        ${order.shippingAddress.fullName}<br/>
        ${order.shippingAddress.address}<br/>
        ${order.shippingAddress.city},
        ${order.shippingAddress.state} -
        ${order.shippingAddress.pincode}<br/>
        Phone: ${order.shippingAddress.phone}
      </p>

      <p style="margin-top:20px;">
        — Team <b>TyreFusion</b>
      </p>
    </div>
  `;

  /* -------------------- SEND MAIL -------------------- */
  await transporter.sendMail({
    from: `"TyreFusion" <${process.env.EMAIL_USER}>`,
    to,
    subject: `TyreFusion Order Confirmation – ${order._id}`,
    html,
    attachments,
  });
};
