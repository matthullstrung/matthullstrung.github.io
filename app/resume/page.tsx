import PageNav from "../../components/PageNav";

const logs = [
  "Built RAG systems",
  "Fine-tuned model workflows",
  "Created computer vision pipelines",
  "Automated support tickets",
  "Built internal tools for operators"
];

export default function ResumePage() {
  return (
    <main className="subpage">
      <PageNav />
      <section className="subpage-hero">
        <p>Resume</p>
        <h1>Mission log.</h1>
      </section>
      <ol className="subpage-timeline">
        {logs.map((log, index) => (
          <li key={log}>
            <span>20{23 + Math.floor(index / 2)}</span>
            <p>{log}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
