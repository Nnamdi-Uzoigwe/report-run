import type { Metadata } from "next";
import { LegalDocument, type LegalSection } from "@/components/public/LegalDocument";

export const metadata: Metadata = {
  title: "Cookie Policy — EduNovtryx",
  description: "How EduNovtryx uses cookies on its website and dashboard.",
};

const sections: LegalSection[] = [
  {
    id: "what-are-cookies",
    heading: "What are cookies",
    body: (
      <p>
        Cookies are small text files placed on your device when you visit a
        website. They can be used to keep you signed in, remember
        preferences, or measure how a site is used. This policy explains the
        cookies EduNovtryx uses and why.
      </p>
    ),
  },
  {
    id: "cookies-we-use",
    heading: "Cookies we use",
    body: (
      <>
        <p>
          EduNovtryx keeps cookie use to the minimum needed to run the
          Service. We currently use one category of cookie:
        </p>
        <ul>
          <li>
            <strong>Strictly necessary — session/authentication cookie.</strong>{" "}
            When you sign in, we set an <code>rr_refresh</code> cookie. It is
            marked <code>httpOnly</code>, meaning it cannot be read by
            page scripts, and is used solely to keep you signed in between
            visits and to route requests to the dashboard versus the public
            site. The Service cannot function without this cookie.
          </li>
        </ul>
        <p>
          We do not currently use analytics, advertising, or third-party
          tracking cookies on the EduNovtryx website or dashboard. If this
          changes in the future, we will update this policy and, where
          required by law, request your consent before setting non-essential
          cookies.
        </p>
      </>
    ),
  },
  {
    id: "third-party-cookies",
    heading: "Third-party cookies",
    body: (
      <p>
        When you make a payment, you are directed to Paystack&rsquo;s
        secure checkout, which may set its own cookies to process the
        transaction. Those cookies are governed by Paystack&rsquo;s own
        privacy and cookie practices, not by EduNovtryx.
      </p>
    ),
  },
  {
    id: "managing-cookies",
    heading: "Managing cookies",
    body: (
      <>
        <p>
          Because our authentication cookie is strictly necessary, disabling
          it will prevent you from staying signed in to the dashboard.
        </p>
        <p>
          Most browsers let you view, delete, or block cookies through their
          settings. If you block the <code>rr_refresh</code> cookie, you
          will need to sign in again each time you visit the dashboard, and
          some features may not work correctly.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    heading: "Changes to this policy",
    body: (
      <p>
        We may update this Cookie Policy if the cookies we use change. Any
        update will be posted on this page with a new &ldquo;Last
        updated&rdquo; date.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact us",
    body: (
      <p>
        Questions about this Cookie Policy can be sent to{" "}
        <a href="mailto:info@novtryx.com">info@novtryx.com</a>.
      </p>
    ),
  },
];

export default function CookiePolicyPage() {
  return (
    <LegalDocument
      title="Cookie Policy"
      lastUpdated="6 July 2026"
      intro={
        <p>
          This Cookie Policy should be read alongside our{" "}
          <a href="/privacy-policy" className="text-navy-600">
            Privacy Policy
          </a>
          . It explains exactly which cookies EduNovtryx sets and why.
        </p>
      }
      sections={sections}
    />
  );
}