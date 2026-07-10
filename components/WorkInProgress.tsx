import PageNav from "./PageNav";

export default function WorkInProgress({ section }: { section: string }) {
  return (
    <main className="subpage">
      <PageNav />
      <section className="subpage-hero">
        <p>{section}</p>
        <h1>Work in progress.</h1>
      </section>
    </main>
  );
}
