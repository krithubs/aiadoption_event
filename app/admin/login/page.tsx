import { AdminLoginForm } from "@/components/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <div className="hero">
      <section className="intro">
        <div className="eyebrow">Operations</div>
        <h1>Admin Console</h1>
        <p className="lead">Review registrations, inspect supporting documents, update status, and export name tags.</p>
      </section>
      <AdminLoginForm />
    </div>
  );
}
