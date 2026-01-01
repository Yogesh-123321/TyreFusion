import { CheckCircle, Star, ThumbsUp, Truck, MapPin, Users } from "lucide-react";

export default function About() {
  return (
    <div className="bg-background text-foreground">

      {/* HERO */}
      <section className="relative w-full overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-400 dark:from-orange-700 dark:via-orange-600 dark:to-amber-500" />

        <div className="relative max-w-7xl mx-auto px-4 py-14 md:py-20 text-center text-white">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            About TyreFusion.in
          </h1>

          <p className="opacity-95 max-w-2xl mx-auto text-sm md:text-base">
            Genuine tyres. Wholesale pricing. Honest guidance — delivered across India.
          </p>
        </div>
      </section>

      {/* WHO WE ARE */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16 grid md:grid-cols-2 gap-10 items-center">

        <div>
          <h2 className="text-2xl font-semibold mb-3">
            Who We Are
          </h2>

          <p className="opacity-80 mb-4 leading-relaxed">
            TyreFusion.in is built with one goal — to make quality tyres accessible,
            transparent and affordable for everyone.
          </p>

          <p className="opacity-80 mb-4 leading-relaxed">
            We source directly from trusted factories to ensure
            authenticity and best prices — removing unnecessary middle layers.
          </p>

          <p className="opacity-80 leading-relaxed">
            Our promise is simple:
            <strong> quality, transparency and long-term value.</strong>
          </p>
        </div>

        <div className="rounded-xl overflow-hidden border border-border shadow bg-card">
          <img
            src="https://images.unsplash.com/photo-1600267185393-e158a98703de?q=80"
            alt="Warehouse"
            className="object-cover w-full h-full"
          />
        </div>
      </section>

      {/* HIGHLIGHT STATS */}
      <section className="py-10 md:py-12 border-y border-border bg-muted/40">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">

          <div>
            <p className="text-3xl font-bold">1M+</p>
            <p className="opacity-70 text-sm mt-1">Products Delivered</p>
          </div>

          <div>
            <p className="text-3xl font-bold">100+</p>
            <p className="opacity-70 text-sm mt-1">Cities Served</p>
          </div>

          <div>
            <p className="text-3xl font-bold">5+ Years</p>
            <p className="opacity-70 text-sm mt-1">Experience</p>
          </div>

          <div>
            <p className="text-3xl font-bold">Wholesale</p>
            <p className="opacity-70 text-sm mt-1">Direct Pricing</p>
          </div>

        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="max-w-7xl mx-auto px-4 py-14 md:py-16">
        <h2 className="text-2xl font-semibold mb-6">Why Choose TyreFusion?</h2>

        <div className="grid md:grid-cols-3 gap-6">

          <div className="p-6 border border-border rounded-2xl shadow bg-card">
            <div className="flex gap-3 items-center mb-2">
              <CheckCircle className="text-orange-500" />
              <h3 className="font-semibold">Genuine Products</h3>
            </div>
            <p className="text-sm opacity-85">
              100% authentic tyres sourced only from verified suppliers.
            </p>
          </div>

          <div className="p-6 border border-border rounded-2xl shadow bg-card">
            <div className="flex gap-3 items-center mb-2">
              <Star className="text-orange-500" />
              <h3 className="font-semibold">Best Wholesale Pricing</h3>
            </div>
            <p className="text-sm opacity-85">
              Transparent pricing without unfair mark-ups.
            </p>
          </div>

          <div className="p-6 border border-border rounded-2xl shadow bg-card">
            <div className="flex gap-3 items-center mb-2">
              <ThumbsUp className="text-orange-500" />
              <h3 className="font-semibold">Honest Guidance</h3>
            </div>
            <p className="text-sm opacity-85">
              We recommend what fits — not what costs more.
            </p>
          </div>

        </div>
      </section>

      {/* LOGISTICS & TRUST */}
      <section className="max-w-7xl mx-auto px-4 pb-14">

        <div className="grid md:grid-cols-3 gap-6">

          <div className="rounded-2xl border border-border p-6 bg-card shadow">
            <Truck className="text-orange-500 mb-3" />
            <h3 className="font-semibold mb-1">Pan-India Delivery</h3>
            <p className="text-sm opacity-80">
              Fast, tracked dispatch with trusted courier partners.
            </p>
          </div>

          <div className="rounded-2xl border border-border p-6 bg-card shadow">
            <MapPin className="text-orange-500 mb-3" />
            <h3 className="font-semibold mb-1">Expanding Network</h3>
            <p className="text-sm opacity-80">
              Serving customers across metro and tier-2 cities.
            </p>
          </div>

          <div className="rounded-2xl border border-border p-6 bg-card shadow">
            <Users className="text-orange-500 mb-3" />
            <h3 className="font-semibold mb-1">Trusted by Customers</h3>
            <p className="text-sm opacity-80">
              Repeat buyers and referrals keep us growing.
            </p>
          </div>

        </div>
      </section>

      {/* REVIEWS */}
      <section className="max-w-7xl mx-auto px-4 pb-12 md:pb-16">
        <h2 className="text-2xl font-semibold mb-6">What Our Buyers Say</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-5 border border-border rounded-2xl bg-card shadow-sm">
            <p className="text-sm italic opacity-90 mb-2">
              “Great prices and fast delivery — highly recommend!”
            </p>
            <p className="text-sm font-semibold">— Sneha</p>
          </div>

          <div className="p-5 border border-border rounded-2xl bg-card shadow-sm">
            <p className="text-sm italic opacity-90 mb-2">
              “Support helped me choose the right tyre. Honest team.”
            </p>
            <p className="text-sm font-semibold">— Harsh</p>
          </div>

          <div className="p-5 border border-border rounded-2xl bg-card shadow-sm">
            <p className="text-sm italic opacity-90 mb-2">
              “Saved money and got genuine stock. Totally satisfied.”
            </p>
            <p className="text-sm font-semibold">— Nisha</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-12 border-t border-border">
        <h3 className="text-xl font-semibold mb-2">
          Ready to find the right tyres?
        </h3>

        <p className="opacity-80 mb-4">
          Explore our collection — or contact us for expert guidance.
        </p>

        <a
          href="/"
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg shadow-sm transition"
        >
          Shop Now
        </a>
      </section>
    </div>
  );
}
