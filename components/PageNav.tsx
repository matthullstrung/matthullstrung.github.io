const links = [
  ["/projects", "Projects"],
  ["/resume", "Resume"],
  ["/experience", "Experience"],
  ["/contact", "Contact"]
] as const;

export default function PageNav() {
  return (
    <nav className="page-nav" aria-label="Portfolio pages">
      <a href="/">MH</a>
      <div>
        {links.map(([href, label]) => (
          <a key={href} href={href}>
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}
