import { RegistrationForm } from "@/components/RegistrationForm";

export default function HomePage() {
  return (
    <div className="hero">
      <section className="intro">
        <div className="eyebrow">Event registration</div>
        <h1>Register for CMD AI Adoption Exam 2026</h1>
        <p className="lead">
          Submit your details, attach supporting documents, and receive a secure reference code for later edits.
        </p>
        <div className="proof-grid" aria-label="Registration highlights">
          <div className="proof">
            <strong>Secure return</strong>
            <span>Reference code plus password protects edits.</span>
          </div>
          <div className="proof">
            <strong>Multiple files</strong>
            <span>PDF, JPG, PNG, and DOCX documents accepted.</span>
          </div>
          <div className="proof">
            <strong>Admin ready</strong>
            <span>Review details and download name tag PDFs.</span>
          </div>
        </div>
      </section>
      <RegistrationForm mode="create" />
    </div>
  );
}
