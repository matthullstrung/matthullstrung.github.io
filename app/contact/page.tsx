import PageNav from "../../components/PageNav";

export default function ContactPage() {
  return (
    <main className="subpage">
      <PageNav />
      <section className="subpage-hero">
        <p>Contact</p>
        <h1>Open channel.</h1>
      </section>
      <section className="contact-panel">
        <a href="mailto:matthew@example.com">matthew@example.com</a>
        <a href="https://linkedin.com/in/matthewhullstrung">LinkedIn</a>
        <a href="https://github.com/matthewhullstrung">GitHub</a>
      </section>
    </main>
  );
}
