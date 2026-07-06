import type { Metadata } from "next";
import { LegalDocument, type LegalSection } from "@/components/public/LegalDocument";

export const metadata: Metadata = {
  title: "Terms of Service — ReportRun",
  description: "The terms that govern use of the ReportRun platform.",
};

const sections: LegalSection[] = [
  {
    id: "acceptance",
    heading: "Acceptance of terms",
    body: (
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern access to and use
        of ReportRun&rsquo;s website and school-management platform (the
        &ldquo;Service&rdquo;), operated by ReportRun (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;). By creating an account, subscribing to a plan, or
        otherwise using the Service, you agree to these Terms on behalf of
        yourself and, where applicable, the school you represent (the
        &ldquo;School&rdquo;). If you do not agree, do not use the Service.
      </p>
    ),
  },
  {
    id: "the-service",
    heading: "Description of the Service",
    body: (
      <>
        <p>
          ReportRun provides tools for schools to manage staff duty
          allocation, student academic results, attendance, fee collection,
          and parent communication, delivered as a subscription
          (&ldquo;Software-as-a-Service&rdquo;) product.
        </p>
        <p>
          We may add, change, or remove features of the Service over time. We
          will make reasonable efforts to notify Schools of material changes
          that affect core functionality.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    heading: "Accounts and roles",
    body: (
      <>
        <p>
          A School must designate at least one administrator account when
          setting up the Service. Administrators may invite staff members,
          who access the Service under roles and permissions the
          administrator configures.
        </p>
        <p>
          You are responsible for maintaining the confidentiality of your
          login credentials and for all activity that occurs under your
          account. Notify us promptly at{" "}
          <a href="mailto:hello@reportrun.ng">hello@reportrun.ng</a> if you
          suspect unauthorised access.
        </p>
      </>
    ),
  },
  {
    id: "plans-and-payment",
    heading: "Plans, billing, and payment",
    body: (
      <>
        <p>
          The Service is offered under Free, Basic, Growth, Professional, and
          Enterprise plans, each with different feature and usage limits as
          described on our{" "}
          <a href="/pricing">Pricing page</a>. Paid plans are billed on a
          recurring basis in Nigerian Naira (NGN).
        </p>
        <p>
          Subscription payments are processed securely by Paystack. By
          subscribing to a paid plan, you authorise us to charge the payment
          method provided via Paystack for the applicable subscription fees.
        </p>
        <p>
          Fees are non-refundable except where required by law or expressly
          stated at the time of purchase. We may change subscription pricing
          with at least 30 days&rsquo; notice to existing Schools before the
          change takes effect on their next billing cycle.
        </p>
        <p>
          If a payment fails or a subscription lapses, we may downgrade the
          account to the Free plan or restrict access to paid features until
          payment is resolved.
        </p>
      </>
    ),
  },
  {
    id: "school-data-responsibility",
    heading: "School responsibility for student and parent data",
    body: (
      <>
        <p>
          The School is the data controller for all staff, student, and
          parent/guardian data it enters into the Service, and is
          responsible for:
        </p>
        <ul>
          <li>
            Having a lawful basis, and any consents required by law, to
            collect and enter student, staff, and parent data into the
            Service.
          </li>
          <li>
            The accuracy of academic, attendance, and fee records entered or
            uploaded, including via the PDF results scraper.
          </li>
          <li>
            Configuring SMS/email reminder rules in line with applicable
            communication and privacy laws.
          </li>
          <li>
            Managing which staff members have access to which student
            records within the School&rsquo;s account.
          </li>
        </ul>
        <p>
          Our processing of this data on the School&rsquo;s behalf is
          governed by our{" "}
          <a href="/data-processing-agreement">Data Processing Agreement</a>.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    heading: "Acceptable use",
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>
            Use the Service to enter or transmit data you do not have the
            right to process, including student data entered without an
            appropriate legal basis.
          </li>
          <li>
            Attempt to access another School&rsquo;s data, or circumvent
            access controls or account isolation between schools.
          </li>
          <li>
            Reverse-engineer, resell, or use the Service to build a
            competing product.
          </li>
          <li>
            Use the Service to send unsolicited, misleading, or unlawful
            communications to parents, staff, or students.
          </li>
          <li>
            Introduce malware, attempt to disrupt the Service, or probe its
            security without authorisation.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "intellectual-property",
    heading: "Intellectual property",
    body: (
      <>
        <p>
          The Service, including its software, design, and branding, is
          owned by ReportRun and protected by intellectual property laws. We
          grant Schools a limited, non-exclusive, non-transferable licence to
          use the Service during an active subscription.
        </p>
        <p>
          Data a School enters into the Service (student records, staff
          records, fee ledgers, and similar content) remains the property of
          the School. We claim no ownership over School data, and use it only
          to provide the Service as described in our Privacy Policy.
        </p>
      </>
    ),
  },
  {
    id: "termination",
    heading: "Suspension and termination",
    body: (
      <>
        <p>
          A School may cancel its subscription at any time from account
          settings, effective at the end of the current billing period.
        </p>
        <p>
          We may suspend or terminate access to the Service, with notice
          where practicable, if a School breaches these Terms, fails to pay
          applicable fees, or if we reasonably believe continued access poses
          a security or legal risk.
        </p>
        <p>
          Upon termination, a School may export its data for a limited period
          as described in our Privacy Policy, after which associated data may
          be deleted or anonymised.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    heading: "Disclaimers",
    body: (
      <p>
        The Service is provided &ldquo;as is&rdquo; and &ldquo;as
        available&rdquo;, without warranties of any kind, whether express or
        implied, including warranties of merchantability, fitness for a
        particular purpose, or non-infringement. We do not warrant that the
        Service will be uninterrupted or error-free.
      </p>
    ),
  },
  {
    id: "liability",
    heading: "Limitation of liability",
    body: (
      <p>
        To the maximum extent permitted by law, ReportRun will not be liable
        for indirect, incidental, special, or consequential damages arising
        from use of the Service. Our aggregate liability for any claim
        arising out of these Terms will not exceed the subscription fees
        paid by the School in the three months preceding the claim.
      </p>
    ),
  },
  {
    id: "governing-law",
    heading: "Governing law",
    body: (
      <p>
        These Terms are governed by the laws of the Federal Republic of
        Nigeria. Any dispute arising from these Terms or the Service will be
        subject to the exclusive jurisdiction of the courts sitting in the
        Federal Capital Territory, Abuja.
      </p>
    ),
  },
  {
    id: "changes-to-terms",
    heading: "Changes to these terms",
    body: (
      <p>
        We may update these Terms from time to time. We will post the
        updated Terms on this page with a new &ldquo;Last updated&rdquo;
        date, and will notify School administrators by email of material
        changes. Continued use of the Service after changes take effect
        constitutes acceptance of the updated Terms.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact us",
    body: (
      <p>
        Questions about these Terms can be sent to{" "}
        <a href="mailto:hello@reportrun.ng">hello@reportrun.ng</a> or by post
        to 14 Ahmadu Bello Way, Abuja, FCT, Nigeria.
      </p>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <LegalDocument
      title="Terms of Service"
      lastUpdated="6 July 2026"
      effectiveDate="6 July 2026"
      intro={
        <p>
          Please read these Terms carefully before using ReportRun. They
          apply to school administrators, staff members, and anyone else who
          accesses the Service on a School&rsquo;s behalf.
        </p>
      }
      sections={sections}
    />
  );
}