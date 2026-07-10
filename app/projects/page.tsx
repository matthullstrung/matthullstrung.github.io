import WorkInProgress from "../../components/WorkInProgress";

/* Placeholder content retained for future development.
const projects = [
  ["RAG Command Center", "Retrieval, evaluation, and operator tooling for production AI workflows."],
  ["Vision Pipeline", "Computer vision automation with quality loops and pragmatic deployment."],
  ["Support Autopilot", "Ticket triage and internal systems that remove repetitive work."]
];
*/

export default function ProjectsPage() {
  return <WorkInProgress section="Projects" />;
}

/* Placeholder content retained for future development.
function ProjectsContent() {
  return (
    <main className="subpage">
      <PageNav />
      <section className="subpage-hero">
        <p>Projects</p>
        <h1>Work with gravity.</h1>
      </section>
      <section className="subpage-grid">
        {projects.map(([name, copy], index) => (
          <article key={name} className="mission-card">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{name}</h2>
            <p>{copy}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
*/
