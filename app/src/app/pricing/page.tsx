"use client";

import Link from "next/link";
import { pricingPlans } from "@/data/mockData";
import { CheckoutModal } from "@/components/CheckoutModal";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const faqs = [
  {
    q: "Can I switch plans later?",
    a: "Yes. You can upgrade or downgrade at any time. Changes take effect immediately.",
  },
  {
    q: "Is there a free trial for Pro?",
    a: "The Free plan is free forever. Pro plans come with a 14-day money-back guarantee.",
  },
  {
    q: "Do I need a credit card to sign up?",
    a: "No. You can start on the Free plan without any payment information.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards, Mobile Money (MTN, Airtel), and bank transfers.",
  },
];

export default function PricingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState({ name: "", price: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
  }, []);

  const handleActionClick = (planName: string, amountRwf: number, cta: string, e: React.MouseEvent) => {
    // Free plan — let the link navigate normally
    if (amountRwf === 0) return;
    // Business "Contact Sales" — let link navigate (no checkout modal)
    if (cta === "Contact Sales") return;
    // Paid plan + logged in → open payment modal
    if (isLoggedIn) {
      e.preventDefault();
      setSelectedPlan({ name: planName, price: amountRwf });
      setCheckoutModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <CheckoutModal 
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        planName={selectedPlan.name}
        priceAmount={selectedPlan.price}
      />
      {/* Nav */}
      <nav className="w-full sticky top-0 z-50 bg-surface/80 backdrop-blur-md shadow-sm">
        <div className="flex justify-between items-center px-6 py-3 max-w-7xl mx-auto">
          <Link href="/" className="text-2xl font-[var(--font-headline)] font-black tracking-tight text-primary-container">
            MENUZA AI
          </Link>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard" className="px-6 py-2.5 text-sm font-bold text-white bg-primary-container rounded-xl shadow-lg shadow-primary-container/20 hover:shadow-xl active:scale-95 transition-all">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-secondary font-[var(--font-headline)] font-bold text-sm px-4 py-2 hover:bg-primary-container/5 rounded-xl transition-all">
                  Log In
                </Link>
                <Link href="/login" className="hidden md:block px-6 py-2.5 text-sm font-bold text-white bg-primary-container rounded-xl shadow-lg shadow-primary-container/20 hover:shadow-xl active:scale-95 transition-all">
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-20 pb-16 px-6 text-center">
        <span className="inline-block py-1 px-4 rounded-full bg-primary-container/10 text-primary font-bold text-xs tracking-widest uppercase mb-6">
          Pricing
        </span>
        <h1 className="text-5xl md:text-6xl font-[var(--font-headline)] font-extrabold tracking-tighter mb-6">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-secondary max-w-2xl mx-auto">
          Pick the plan that fits your restaurant. No hidden fees, no surprises.
        </p>
      </section>

      {/* Plans */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {pricingPlans.map((plan, i) => (
            <div
              key={i}
              className={`bg-surface-container-lowest p-10 rounded-[2rem] flex flex-col relative ${
                plan.popular
                  ? "border-2 border-primary-container md:scale-105 shadow-2xl z-10"
                  : "border border-outline-variant/10"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-container text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-[var(--font-headline)] font-bold mb-2">{plan.name}</h3>
              <div className="mb-8">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-secondary text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {plan.features.map((f, j) => (
                  <li
                    key={j}
                    className={`flex items-center gap-3 text-sm ${plan.popular ? "text-on-surface" : "text-secondary"}`}
                  >
                    <span
                      className={`material-symbols-outlined ${plan.popular ? "text-primary icon-fill" : "text-tertiary-container"}`}
                    >
                      check_circle
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={isLoggedIn ? "/dashboard" : "/login"}
                onClick={(e) => handleActionClick(plan.name, plan.amountRwf, plan.cta, e)}
                className={`w-full py-4 font-bold rounded-xl transition-all text-center block ${
                  plan.popular
                    ? "bg-gradient-to-tr from-primary to-primary-container text-white shadow-lg shadow-primary-container/20 active:scale-95"
                    : "bg-surface-container-highest text-on-surface hover:bg-surface-variant"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-surface-container-low">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-[var(--font-headline)] font-black mb-12 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10">
                <p className="font-bold mb-2">{faq.q}</p>
                <p className="text-secondary text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-[var(--font-headline)] font-black mb-6">
            Ready to grow your restaurant?
          </h2>
          <p className="text-secondary text-lg mb-10">
            Join restaurants already using MENUZA AI to serve more customers.
          </p>
          <Link
            href="/login"
            className="inline-block px-10 py-5 bg-gradient-to-tr from-primary to-primary-container text-white font-black rounded-2xl text-xl shadow-2xl active:scale-95 transition-all hover:shadow-primary-container/40 hover:shadow-xl"
          >
            Start Free — No Card Required
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="text-xl font-[var(--font-headline)] font-black tracking-tight text-primary-container">
            MENUZA AI
          </span>
          <p className="text-sm text-secondary">© 2026 Menuza Systems Inc. All rights reserved.</p>
          <div className="flex gap-6 text-sm font-semibold text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="/#pricing" className="hover:text-primary transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
