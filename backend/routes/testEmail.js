import express from "express";
import { sendOtpEmail } from "../utils/sendEmail.js";

const router = express.Router();

router.get("/test-email", async (req, res) => {
  try {
    await sendOtpEmail("yogeshmadan1428@gmail.com", "123456");
    res.json({ message: "Test email sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Email failed" });
  }
});

export default router;
