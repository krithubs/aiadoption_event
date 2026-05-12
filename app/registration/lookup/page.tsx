import { LookupForm } from "@/components/LookupForm";

export default function LookupPage() {
  return (
    <div className="hero">
      <section className="intro">
        <div className="eyebrow">Attendee portal</div>
        <h1>Manage your registration</h1>
        <p className="lead">Use your reference code and password to review details, update information, or add documents.</p>
      </section>
      <LookupForm />
    </div>
  );
}
