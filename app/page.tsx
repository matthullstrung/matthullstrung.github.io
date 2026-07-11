"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

const DotSpaceExperience = dynamic(() => import("../components/DotSpaceExperience"), {
  ssr: false,
  loading: () => (
    <div className="scene-loading" aria-hidden="true">
      <span>Loading orbital scene</span>
    </div>
  )
});

const phases = [
  {
    label: "AI Engineer",
    title: "Matt Hullstrung",
    eyebrow: "Builder / product thinker / problem solver",
    note: "Scroll to enter the work."
  },
  {
    label: "Signal",
    title: "Find the problem beneath the request.",
    eyebrow:
      "I listen across users, leadership, domain experts, and technical reality, separating the proposed solution from the problem actually worth solving.",
    note: "Gather the signals that matter."
  },
  {
    label: "Direction",
    title: "Turn insight into a defensible next move.",
    eyebrow:
      "I combine evidence, product judgment, and engineering perspective to decide what to build, why it matters, and how success will be measured.",
    note: "Shape insight into a clear priority."
  },
  {
    label: "Momentum",
    title: "Build with intent. Prove it in motion.",
    eyebrow:
      "I ship focused work, measure its real-world impact, and carry what I learn into the next decision.",
    note: "Move the cursor through the trench."
  },
  {
    label: "Next",
    title: "Explore the work.",
    eyebrow: "Projects, experience, and the thinking behind the systems I build.",
    note: "Choose your next destination."
  }
];

export default function Home() {
  const [introReady, setIntroReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [hyperdrive, setHyperdrive] = useState(false);
  const [finalSlide, setFinalSlide] = useState(false);
  const targetProgress = useRef(0);
  const launchReady = progress >= 0.94;

  useEffect(() => {
    const introTimer = window.setTimeout(() => setIntroReady(true), 1800);
    let frame = 0;
    let displayedProgress = 0;

    const animate = () => {
      const distance = targetProgress.current - displayedProgress;
      displayedProgress = Math.abs(distance) < 0.0001 ? targetProgress.current : displayedProgress + distance * 0.14;
      setProgress(displayedProgress);
      document.documentElement.style.setProperty("--mission-progress", displayedProgress.toFixed(4));
      frame = displayedProgress === targetProgress.current ? 0 : window.requestAnimationFrame(animate);
    };

    const update = () => {
      const scrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      targetProgress.current = Math.min(1, Math.max(0, window.scrollY / scrollMax));
      if (!frame) frame = window.requestAnimationFrame(animate);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.clearTimeout(introTimer);
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (!launchReady) {
      setHyperdrive(false);
      setFinalSlide(false);
      return;
    }

    const timer = window.setTimeout(() => setHyperdrive(true), 450);
    return () => window.clearTimeout(timer);
  }, [launchReady]);

  useEffect(() => {
    if (!hyperdrive) return;
    const timer = window.setTimeout(() => setFinalSlide(true), 4300);
    return () => window.clearTimeout(timer);
  }, [hyperdrive]);

  useEffect(() => {
    const updatePointer = (event: PointerEvent) => {
      setPointer({
        x: event.clientX / window.innerWidth - 0.5,
        y: event.clientY / window.innerHeight - 0.5
      });
    };

    window.addEventListener("pointermove", updatePointer, { passive: true });
    return () => window.removeEventListener("pointermove", updatePointer);
  }, []);

  useEffect(() => {
    const launch = () => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
      return "Mission scroll accepted.";
    };

    console.log("Mission console online. Type launch() to scrub to orbit.");
    (window as typeof window & { launch?: () => string }).launch = launch;
  }, []);

  const phaseIndex = finalSlide ? 4 : progress < 0.16 ? 0 : progress < 0.5 ? 1 : progress < 0.78 ? 2 : 3;
  const phase = phases[phaseIndex];
  const phaseBounds = [[0, 0.16], [0.16, 0.5], [0.5, 0.78], [0.78, 0.94]][Math.min(phaseIndex, 3)];
  const phaseProgress = Math.min(1, Math.max(0, (progress - phaseBounds[0]) / (phaseBounds[1] - phaseBounds[0])));
  const fadeIn = phaseIndex === 0 ? 1 : Math.min(1, phaseProgress / 0.16);
  const fadeOut = Math.min(1, (1 - phaseProgress) / 0.18);
  const copyOpacity = finalSlide ? 1 : Math.min(fadeIn, fadeOut);
  const copyY = phaseProgress < 0.5 ? (1 - copyOpacity) * 18 : (copyOpacity - 1) * 14;
  const interactive = Math.min(1, Math.max(0, (progress - 0.78) / 0.2));
  const flareX = 51 + Math.sin(progress * Math.PI * 1.2) * 7 + pointer.x * interactive * 24;
  const flareY = 48 + progress * 8 + pointer.y * interactive * 18;
  const experienceStyle = {
    "--progress": progress,
    "--phase": phaseIndex,
    "--flare-opacity": 0.28 + progress * 0.58,
    "--grain-opacity": 0.07 + progress * 0.16,
    "--scene-blur": "0px",
    "--scene-scale": 1 + progress * 0.028,
    "--progress-width": `${progress * 100}%`,
    "--flare-x": `${flareX}%`,
    "--flare-y": `${flareY}%`,
    "--flare-ghost-x": `${100 - flareX}%`,
    "--flare-ghost-y": `${100 - flareY}%`,
    "--dock-opacity": progress > 0.62 ? 1 : 0,
    "--dock-y": `${progress > 0.62 ? 0 : 18}px`,
    "--game-opacity": !hyperdrive && progress > 0.86 ? 1 : 0,
    "--copy-opacity": copyOpacity,
    "--copy-y": `${copyY}px`
  } as CSSProperties;

  return (
    <main className={`site home-experience${hyperdrive ? " is-hyperdrive" : ""}${finalSlide ? " is-final" : ""}`} style={experienceStyle}>
      <section className="hero" aria-label="Interactive orbital portfolio introduction">
        <div className="hero-stage">
          <DotSpaceExperience hyperdrive={hyperdrive} />
          <div className="launch-black" aria-hidden="true" />
          <div className="orbital-flare" aria-hidden="true" />
          <div className="hyperdrive-flash" aria-hidden="true" />
          <div className="light-leaks" aria-hidden="true" />
          <div className="film-grain" aria-hidden="true" />
          <div className="visor-vignette" aria-hidden="true" />

          <header className="home-chrome" aria-label="Primary navigation">
            <a className="mark" href="/" aria-label="Home">
              MH
            </a>
            <nav className="home-nav" aria-label="Portfolio pages">
              <a href="/projects">Projects</a>
              <a href="/resume">Resume</a>
              <a href="/experience">Experience</a>
              <a href="/contact">Contact</a>
            </nav>
          </header>

          <div className={`${introReady ? "transmission open" : "transmission"} ${finalSlide ? "final-copy" : phaseIndex === 0 ? "identity-copy" : "process-copy"}`}>
            <p>{phase.label}</p>
            <h1>{phase.title}</h1>
            <span className="transmission-summary">{phase.eyebrow}</span>
          </div>

          <aside className="mission-readout" aria-label="Mission readout">
            <span>Scroll telemetry</span>
            <strong>{Math.round(progress * 100).toString().padStart(2, "0")}%</strong>
            <p>{phase.note}</p>
            <div className="progress-rail" aria-hidden="true">
              <i />
            </div>
          </aside>

          <div className="constellation-map" aria-hidden="true">
            {Array.from({ length: 18 }).map((_, index) => (
              <i
                key={index}
                style={
                  {
                    "--x": `${(index * 73) % 100}%`,
                    "--y": `${(index * 41) % 100}%`,
                    "--drift": `${progress * -42}px`
                  } as CSSProperties
                }
              />
            ))}
          </div>

          {finalSlide ? (
            <nav className="final-destinations" aria-label="Explore portfolio">
              <a href="/projects">
                <span>01</span>
                <strong>Projects</strong>
                <small>Selected systems and product work</small>
              </a>
              <a href="/resume">
                <span>02</span>
                <strong>Resume</strong>
                <small>Experience, capabilities, and impact</small>
              </a>
              <a href="/experience">
                <span>03</span>
                <strong>Experience</strong>
                <small>How I work across the product lifecycle</small>
              </a>
              <a href="/contact">
                <span>04</span>
                <strong>Contact</strong>
                <small>Start a conversation</small>
              </a>
            </nav>
          ) : null}

          <div className="trench-hud" aria-hidden="true">
            <span>Trench run</span>
            <b>Move cursor left / right</b>
            <i />
          </div>
        </div>
      </section>
    </main>
  );
}
