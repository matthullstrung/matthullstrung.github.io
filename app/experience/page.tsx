import type { CSSProperties } from "react";
import WorkInProgress from "../../components/WorkInProgress";

/* Placeholder content retained for future development.
const skills = ["Python", "FastAPI", "AWS", "OpenAI", "React", "Next.js", "Computer Vision", "LLMs", "Docker"];
*/

export default function ExperiencePage() {
  return <WorkInProgress section="Experience" />;
}

/* Placeholder content retained for future development.
function ExperienceContent() {
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
*/
