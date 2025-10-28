// src/components/FloatingWhatsAppButton.jsx
import React from "react";

export default function FloatingWhatsAppButton() {
  // read values from environment
  const number = import.meta.env.VITE_WHATSAPP_NUMBER;
  const message = encodeURIComponent(import.meta.env.VITE_WHATSAPP_MESSAGE || "");

  if (!number) return null; // hide button if number not set

  const whatsappUrl = `https://wa.me/${number}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      title="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-50 hover:scale-110 transition-transform duration-300"
    >
      {/* ✅ Only the image, no circular background */}
      <img
        src="/whatsapp-icon.png"
        alt="WhatsApp"
        className="w-12 h-12 drop-shadow-[0_0_6px_rgba(37,211,102,0.7)]"
      />
    </a>
  );
}
