import { FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-border bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        
        {/* Brand */}
        <div>
          <h2 className="text-xl font-semibold mb-3">
            TyreFusion.in
          </h2>

          <p className="text-sm opacity-80">
            Smart tyre finder — search by car model, tyre size, brand, or AI assistant.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Quick Links
          </h3>

          <ul className="space-y-2 text-sm">
            <li><a href="/" className="hover:opacity-100 opacity-80">Home</a></li>
            <li><a href="/cart" className="hover:opacity-100 opacity-80">Cart</a></li>
            <li><a href="/login" className="hover:opacity-100 opacity-80">Login</a></li>
            <li><a href="/my-orders" className="hover:opacity-100 opacity-80">My Orders</a></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Support
          </h3>

          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:opacity-100 opacity-80">About Us</Link></li>
            <li><Link to="/privacy" className="hover:opacity-100 opacity-80">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:opacity-100 opacity-80">Terms & Conditions</Link></li>
          </ul>

        </div>

        {/* Contact */}
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Contact
          </h3>

          <p className="text-sm opacity-80 mb-2">
            Have questions? We’re here to help.
          </p>

            <p>Shop No. 1315</p>
  <p>S.P. Mukherjee Marg</p>
  <p>Novelty Cinema, Near Old Delhi Railway Station</p>
  <p>Delhi — 110006</p>

  <p className="mt-3 font-semibold">
    GST No: <span className="font-normal">07ERTPK1764H1ZA</span>
  </p>


          <div className="flex gap-4 text-xl opacity-80 hover:opacity-100 transition">
            <a
              href=""
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaFacebook />
            </a>

            <a
              href="https://www.instagram.com/tyre_fusion02/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram />
            </a>
            <a
              href="https://wa.me/918950717305"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaWhatsapp />
            </a>

          </div>
        </div>
      </div>

      <div className="py-3 text-center text-xs opacity-70 border-t border-border">
        © {new Date().getFullYear()} TyreFusion — All rights reserved.
      </div>
    </footer>
  );
}
