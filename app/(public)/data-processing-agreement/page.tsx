import type { Metadata } from "next";
import { LegalDocument, type LegalSection } from "@/components/public/LegalDocument";

export const metadata: Metadata = {
  title: "Data Processing Agreement — ReportRun",
  description:
    "How ReportRun processes School, staff, student, and parent data as a data processor.",
};

const sections: LegalSection[] = [
  {
    id: "purpose",
    heading: "Purpose and scope",
    body: (
      <>
        <p>
          This Data Processing Agreement (&ldquo;DPA&rdquo;) forms part of
          the agreement between a School (the &ldquo;Controller&rdquo;) and
          ReportRun (the &ldquo;Processor&rdquo;) for use of the Service, and
          governs ReportRun&rsquo;s processing of personal data that the
          School submits to the Service, including staff, student, and
          parent/guardian data.
        </p>
        <p>
          It is intended to meet the requirements of the Nigeria Data
          Protection Act 2023 and the Nigeria Data Protection Regulation
          (&ldquo;NDPR&rdquo;) for arrangements between a data controller and
          a data processor.
        </p>
      </>
    ),
  },
  {
    id: "roles",
    heading: "Roles of the parties",
    body: (
      <>
        <p>
          The School is the data controller for staff, student, and parent
          data entered into the Service, and determines the purposes and
          means of processing that data (for example, which records to keep,
          which staff can access them, and which reminders to send).
        </p>
        <p>
          ReportRun is the data processor and processes that data only on
          the School&rsquo;s documented instructions, as set out in this DPA
          and as configured by the School within the Service.
        </p>
      </>
    ),
  },
  {
    id: "nature-of-processing",
    heading: "Nature, purpose, and duration of processing",
    body: (
      <>
        <p>
          <strong>Nature and purpose:</strong> hosting, storage, and
          processing of staff, student, and parent data to provide the
          school-management functions of the Service — including duty
          allocation, results and attendance records, fee ledgers, and
          SMS/email reminders configured by the School.
        </p>
        <p>
          <strong>Categories of data subjects:</strong> school staff,
          students, and parents/guardians.
        </p>
        <p>
          <strong>Categories of data:</strong> names, contact details, dates
          of birth, addresses, academic and attendance records, fee and
          payment records, and duty/role assignments.
        </p>
        <p>
          <strong>Duration:</strong> for as long as the School maintains an
          active subscription, and thereafter only as necessary to comply
          with the data retention terms of our{" "}
          <a href="/privacy-policy">Privacy Policy</a>.
        </p>
      </>
    ),
  },
  {
    id: "processor-obligations",
    heading: "Processor obligations",
    body: (
      <>
        <p>ReportRun will:</p>
        <ul>
          <li>
            Process personal data only on the School&rsquo;s instructions,
            as configured through the Service, unless required otherwise by
            law.
          </li>
          <li>
            Ensure personnel authorised to process personal data are subject
            to confidentiality obligations.
          </li>
          <li>
            Implement appropriate technical and organisational security
            measures, including encryption in transit and logical isolation
            of each School&rsquo;s data.
          </li>
          <li>
            Assist the School, where reasonably possible, in responding to
            data subject requests (such as access, correction, or deletion
            requests) relating to data held in the School&rsquo;s account.
          </li>
          <li>
            Notify the School without undue delay after becoming aware of a
            personal data breach affecting the School&rsquo;s data.
          </li>
          <li>
            Delete or return School data at the end of the subscription, in
            line with our Privacy Policy, except where retention is required
            by law.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "sub-processors",
    heading: "Sub-processors",
    body: (
      <>
        <p>
          The School authorises ReportRun to engage the following categories
          of sub-processor to help deliver the Service:
        </p>
        <ul>
          <li>Cloud hosting and database providers, to store School data.</li>
          <li>
            Paystack, to process subscription and fee payments on the
            School&rsquo;s behalf.
          </li>
          <li>
            SMS and email delivery providers, to send reminders and
            notifications the School configures.
          </li>
        </ul>
        <p>
          ReportRun remains responsible for sub-processors&rsquo; compliance
          with data protection obligations equivalent to those in this DPA,
          and will impose written data protection terms on each
          sub-processor.
        </p>
      </>
    ),
  },
  {
    id: "international-transfers",
    heading: "International transfers",
    body: (
      <p>
        Where a sub-processor stores or processes data outside Nigeria,
        ReportRun will ensure appropriate safeguards are in place to protect
        the data to a standard consistent with the NDPR.
      </p>
    ),
  },
  {
    id: "audit",
    heading: "Audit and cooperation",
    body: (
      <p>
        On reasonable written request, and no more than once per year unless
        required following a security incident, ReportRun will provide the
        School with information reasonably necessary to demonstrate
        compliance with this DPA, and will cooperate with reasonable audit
        requests, subject to confidentiality safeguards.
      </p>
    ),
  },
  {
    id: "liability",
    heading: "Liability",
    body: (
      <p>
        Liability under this DPA is subject to the limitation of liability
        set out in our{" "}
        <a href="/terms-of-service">Terms of Service</a>.
      </p>
    ),
  },
  {
    id: "term",
    heading: "Term",
    body: (
      <p>
        This DPA takes effect when a School begins using the Service and
        remains in effect for as long as ReportRun processes personal data
        on the School&rsquo;s behalf under the Terms of Service.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact us",
    body: (
      <p>
        Questions about this DPA, or requests relating to an audit, can be
        sent to <a href="mailto:hello@reportrun.ng">hello@reportrun.ng</a>.
      </p>
    ),
  },
];

export default function DataProcessingAgreementPage() {
  return (
    <LegalDocument
      title="Data Processing Agreement"
      lastUpdated="6 July 2026"
      intro={
        <p>
          This Data Processing Agreement supplements our{" "}
          <a href="/terms-of-service" className="text-navy-600">
            Terms of Service
          </a>{" "}
          and describes how ReportRun processes staff, student, and parent
          data on behalf of a School.
        </p>
      }
      sections={sections}
    />
  );
}