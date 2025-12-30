import { Shield, Lock, CheckCircle, Cookie, Mail, User } from "lucide-react";
import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="bg-background text-foreground min-h-screen">

      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-400 dark:from-orange-700 dark:via-orange-600 dark:to-amber-500" />

        <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-16 text-center text-white">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            Your Privacy. Our Responsibility.
          </h1>

          <p className="opacity-90 max-w-2xl mx-auto text-sm md:text-base">
            We use your data only to improve your experience and deliver orders — nothing else.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-4 pb-16 space-y-10">

        {/* BLOCK 1 */}
        <div className="rounded-2xl border border-border p-6 md:p-8 bg-card shadow">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="text-orange-500" />
            <h2 className="text-xl font-semibold">What Information We Collect</h2>
          </div>

          <p className="opacity-80 mb-4">
            We only collect what is necessary to process your orders and support you:
          </p>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-orange-500" />
              Name and contact details
            </div>

            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-orange-500" />
              Email & phone number
            </div>

            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-orange-500" />
              Delivery & billing address
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-orange-500" />
              Order history and support details
            </div>
          </div>
        </div>

        {/* BLOCK 2 */}
        <div className="rounded-2xl border border-border p-6 md:p-8 bg-card shadow">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="text-orange-500" />
            <h2 className="text-xl font-semibold">How We Use Your Data</h2>
          </div>

          <ul className="space-y-2 opacity-90">
            <li>• To process and deliver your orders smoothly</li>
            <li>• To provide customer support</li>
            <li>• To improve website performance and user experience</li>
            <li>• To prevent fraud and secure transactions</li>
          </ul>
        </div>

        {/* BLOCK 3 */}
        <div className="rounded-2xl border border-border p-6 md:p-8 bg-card shadow">
          <div className="flex items-center gap-3 mb-3">
            <Lock className="text-orange-500" />
            <h2 className="text-xl font-semibold">Data Sharing</h2>
          </div>

          <p className="opacity-85">
            We do <strong>not sell or misuse your data.</strong>  
            Limited information may be shared only with verified partners such as:
          </p>

          <ul className="mt-2 space-y-1 opacity-90">
            <li>• Courier / delivery partners</li>
            <li>• Secure payment gateways</li>
            <li>• Support tools for communication</li>
          </ul>
        </div>

        {/* BLOCK 4 */}
        <div className="rounded-2xl border border-border p-6 md:p-8 bg-card shadow">
          <div className="flex items-center gap-3 mb-3">
            <Cookie className="text-orange-500" />
            <h2 className="text-xl font-semibold">Cookies</h2>
          </div>

          <p className="opacity-85">
            Cookies help us understand preferences and improve your browsing
            experience. You may disable them anytime in browser settings.
          </p>
        </div>

        {/* BLOCK 5 */}
        <div className="rounded-2xl border border-border p-6 md:p-8 bg-card shadow">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="text-orange-500" />
            <h2 className="text-xl font-semibold">Your Rights</h2>
          </div>

          <p className="opacity-85">
            You may request correction or deletion of your data anytime.
          </p>

          <p className="mt-3">
            Contact us at: <strong>+91-8950717305</strong>
          </p>

          <p className="text-xs opacity-70 mt-4">
            This policy may be updated if required.
          </p>
        </div>
      </div>
    </div>
  );
}
