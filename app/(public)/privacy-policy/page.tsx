import type { Metadata } from "next";
import { LegalDocument, type LegalSection } from "@/components/public/LegalDocument";

export const metadata: Metadata = {
  title: "Privacy Policy — ReportRun",
  description:
    "How ReportRun collects, uses, and protects data for schools, staff, students, and parents.",
};

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    heading: "Who we are",
    body: (
      <>
        <p>
          ReportRun (&ldquo;<strong>ReportRun</strong>&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;) is a school management platform built for Nigerian
          schools, covering staff duty allocation, academic results, fee
          collection, attendance, and parent communication. ReportRun is
          operated from 14 Ahmadu Bello Way, Abuja, FCT, Nigeria.
        </p>
        <p>
          This Privacy Policy explains what personal data we collect through
          the ReportRun website and application (the &ldquo;Service&rdquo;),
          why we collect it, and the choices available to you. It applies to
          school administrators, staff, students, and parents/guardians whose
          data is processed through the Service.
        </p>
        <p>
          A school that signs up for ReportRun (the &ldquo;
          <strong>School</strong>&rdquo;) is the data controller for the
          student, parent, and staff records it enters into the platform.
          ReportRun acts as a data processor on the School&rsquo;s behalf for
          that data, and as a data controller for the account and billing
          information of the School itself. See our{" "}
          <a href="/data-processing-agreement">Data Processing Agreement</a>{" "}
          for how we handle data on a School&rsquo;s behalf.
        </p>
      </>
    ),
  },
  {
    id: "data-we-collect",
    heading: "Data we collect",
    body: (
      <>
        <p>We collect the following categories of data:</p>
        <ul>
          <li>
            <strong>School account data:</strong> school name, address,
            registered admin contact details, subscription plan, and billing
            history.
          </li>
          <li>
            <strong>Staff data:</strong> name, email address, phone number,
            role, and duty assignments entered by the School.
          </li>
          <li>
            <strong>Student data:</strong> name, date of birth, class/section,
            home address, academic records, attendance records, and, where
            applicable, guardian/parent contact details. Student data is
            entered by the School, not collected directly from students by
            us.
          </li>
          <li>
            <strong>Parent/guardian data:</strong> name, email address, and
            phone number, used to deliver fee reminders and academic updates
            by SMS or email.
          </li>
          <li>
            <strong>Payment data:</strong> fee ledger entries and payment
            references. Card and bank details are collected and processed
            directly by our payment processor, Paystack — we do not store
            full card numbers on our servers.
          </li>
          <li>
            <strong>Usage and device data:</strong> IP address, browser type,
            and pages visited on our public website and dashboard, collected
            for security and troubleshooting.
          </li>
          <li>
            <strong>Contact form submissions:</strong> name, email, phone
            number, school name, and message content submitted through our{" "}
            <a href="/contact">contact page</a>.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "childrens-data",
    heading: "Student (children&rsquo;s) data",
    body: (
      <>
        <p>
          Because ReportRun is used by schools to manage student records, we
          process personal data belonging to minors. This data is entered and
          controlled by the School, not by us or by the student directly. We
          rely on the School to have the appropriate legal basis and, where
          required, parental or guardian consent, to submit student data to
          the Service.
        </p>
        <p>
          We do not use student data for advertising or marketing, and we do
          not sell student data to any third party. Student data is used
          solely to provide the school-management functions the School has
          configured (results, attendance, fee ledgers, and communications).
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-data",
    heading: "How we use data",
    body: (
      <ul>
        <li>To provide, operate, and maintain the Service for a School.</li>
        <li>
          To process subscription payments and reconcile the fee collection
          ledger via Paystack.
        </li>
        <li>
          To send SMS and email reminders configured by a School to
          parents/guardians (for example, fee due-date reminders).
        </li>
        <li>To respond to support and contact-form requests.</li>
        <li>
          To maintain the security of the Service, including detecting and
          preventing fraud, abuse, or unauthorised access.
        </li>
        <li>
          To comply with legal obligations, including tax and financial
          record-keeping requirements.
        </li>
      </ul>
    ),
  },
  {
    id: "legal-basis",
    heading: "Legal basis for processing",
    body: (
      <>
        <p>
          We process personal data in line with the Nigeria Data Protection
          Act 2023 and the Nigeria Data Protection Regulation
          (&ldquo;NDPR&rdquo;). Depending on the data and purpose, our legal
          basis includes:
        </p>
        <ul>
          <li>
            <strong>Performance of a contract</strong> — to provide the
            Service under our Terms of Service and a School&rsquo;s
            subscription.
          </li>
          <li>
            <strong>Consent</strong> — where a School or parent has given
            consent for communications, such as SMS/email reminders.
          </li>
          <li>
            <strong>Legitimate interest</strong> — to secure and improve the
            Service, prevent fraud, and respond to inquiries.
          </li>
          <li>
            <strong>Legal obligation</strong> — to meet tax, accounting, and
            regulatory requirements.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "sharing",
    heading: "How we share data",
    body: (
      <>
        <p>We share personal data only where necessary, with:</p>
        <ul>
          <li>
            <strong>Paystack</strong>, our payment processor, to process
            subscription and fee payments.
          </li>
          <li>
            <strong>SMS and email delivery providers</strong>, to send
            reminders and notifications configured by a School.
          </li>
          <li>
            <strong>Cloud hosting and database providers</strong>, who store
            data on our behalf under confidentiality and security
            obligations.
          </li>
          <li>
            <strong>Regulators or law enforcement</strong>, where required by
            law or to protect the rights, property, or safety of ReportRun,
            our users, or others.
          </li>
        </ul>
        <p>
          We do not sell personal data to third parties, and we do not share
          student data for advertising purposes.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    heading: "Cookies",
    body: (
      <p>
        The Service uses a small number of strictly necessary cookies to keep
        you signed in and to secure your session. See our{" "}
        <a href="/cookie-policy">Cookie Policy</a> for details.
      </p>
    ),
  },
  {
    id: "retention",
    heading: "Data retention",
    body: (
      <>
        <p>
          We retain School, staff, and student data for as long as a
          School&rsquo;s subscription is active, plus a reasonable period
          afterward to allow the School to export its records and to meet our
          legal and accounting obligations.
        </p>
        <p>
          If a School closes its account, we will delete or anonymise the
          data associated with that account within a reasonable period,
          except where retention is required by law or for the resolution of
          disputes.
        </p>
      </>
    ),
  },
  {
    id: "security",
    heading: "Data security",
    body: (
      <p>
        We use technical and organisational measures — including encryption
        in transit, access controls, and isolation of each School&rsquo;s
        data from other schools on the platform — to protect personal data
        against unauthorised access, loss, or misuse. No method of
        transmission or storage is completely secure, and we cannot
        guarantee absolute security.
      </p>
    ),
  },
  {
    id: "your-rights",
    heading: "Your rights",
    body: (
      <>
        <p>
          Subject to applicable law, you may have the right to request
          access to, correction of, or deletion of your personal data, to
          object to certain processing, or to withdraw consent where
          processing is based on consent.
        </p>
        <p>
          If your data is held on a school&rsquo;s ReportRun account (for
          example, as a student, parent, or staff member), please contact the
          School directly, as it controls that data. If you are a School
          administrator, contact us using the details below.
        </p>
      </>
    ),
  },
  {
    id: "international-transfers",
    heading: "International data transfers",
    body: (
      <p>
        Our infrastructure providers may process or store data outside
        Nigeria. Where this occurs, we require appropriate safeguards to be
        in place, consistent with the requirements of the NDPR, to protect
        personal data to a standard comparable to Nigerian law.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "Changes to this policy",
    body: (
      <p>
        We may update this Privacy Policy from time to time. We will post the
        updated version on this page with a new &ldquo;Last updated&rdquo;
        date. Material changes will be communicated to School administrators
        by email where practicable.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact us",
    body: (
      <p>
        Questions about this Privacy Policy or your data can be sent to{" "}
        <a href="mailto:hello@reportrun.ng">hello@reportrun.ng</a> or by post
        to 14 Ahmadu Bello Way, Abuja, FCT, Nigeria.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      lastUpdated="6 July 2026"
      intro={
        <p>
          This policy describes how ReportRun handles personal data across
          our website and school-management platform. It is written to be
          read alongside our{" "}
          <a href="/terms-of-service" className="text-navy-600">
            Terms of Service
          </a>
          ,{" "}
          <a href="/cookie-policy" className="text-navy-600">
            Cookie Policy
          </a>
          , and{" "}
          <a href="/data-processing-agreement" className="text-navy-600">
            Data Processing Agreement
          </a>
          .
        </p>
      }
      sections={sections}
    />
  );
}