import type { CSSProperties } from "react";
import PageNav from "../../components/PageNav";

const skills = ["Python", "FastAPI", "AWS", "OpenAI", "React", "Next.js", "Computer Vision", "LLMs", "Docker"];

export default function ExperiencePage() {
  return (
    <main className="subpage">
      <PageNav />
      <section className="subpage-hero">
        <p>Experience</p>
        <h1>Signal map.</h1>
      </section>
      <section className="skill-orbit">
        {skills.map((skill, index) => (
          <span key={skill} style={{ "--i": index } as CSSProperties}>
            {skill}
          </span>
        ))}
      </section>
    </main>
  );
}
