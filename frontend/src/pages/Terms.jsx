import { Link } from "react-router-dom";
import { Shield, CheckCircle, AlertTriangle, Truck, CreditCard } from "lucide-react";

export default function Terms() {
  return (
    <div className="bg-background text-foreground min-h-screen">

      {/* HERO */}
      <section className="relative w-full overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-400 dark:from-orange-700 dark:via-orange-600 dark:to-amber-500" />

        <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-16 text-center text-white">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            Terms & Conditions
          </h1>

          <p className="opacity-90 max-w-2xl mx-auto text-sm md:text-base">
            Please read these terms carefully before using TyreFusion.in
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-4 pb-16 space-y-10">

        {/* Section */}
        <div className="rounded-2xl border border-border p-6 md:p-8 bg-card shadow">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="text-orange-500" />
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
          </div>

          <p className="opacity-85">
            By accessing or purchasing from TyreFusion.in, you agree to follow all
            terms mentioned on this page. If you do not agree, please do not use the site.
          </p>
        </div>

        {/* Section */}
        <div className="rounded-2xl border border-border p-6 md:p-8 bg-card shadow">
          <div className="flex items-center gap-3 mb-3">
            <CreditCard className="text-orange-500" />
            <h2 className="text-xl font-semibold">2. Pricing & Payments</h2>
          </div>

          <p className="opacity-85">
            All prices shown are inclusive/exclusive of taxes where applicable.
            Orders are confirmed only after successful payment.
          </p>
        </div>

        {/* Section */}
        <div className="rounded-2xl border border-border p-6 md:p-8 bg-card shadow">
          <div className="flex items-center gap-3 mb-3">
            <Truck className="text-orange-500" />
            <h2 className="text-xl font-semibold">3. Shipping & Delivery</h2>
          </div>

          <p className="opacity-85">
            Delivery timelines may vary depending on location, availability and logistics.
          </p>
        </div>

        {/* Section */}
        <div className="rounded-2xl border border-border p-6 md:p-8 bg-card shadow">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="text-orange-500" />
            <h2 className="text-xl font-semibold">4. Returns & Cancellations</h2>
          </div>

          <p className="opacity-85">
            Returns or cancellations are subject to inspection and approval 
            based on product condition and policy.
          </p>
        </div>

        {/* Section */}
        <div className="rounded-2xl border border-border p-6 md:p-8 bg-card shadow">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="text-orange-500" />
            <h2 className="text-xl font-semibold">5. Limitation of Liability</h2>
          </div>

          <p className="opacity-85">
            TyreFusion.in is not liable for losses arising from improper installation,
            misuse, unauthorized handling, or third-party services.
          </p>

          <p className="text-xs opacity-70 mt-4">
            Terms may be updated when required.
          </p>
        </div>

      </div>
    </div>
  );
}
