import { ArrowUpRight } from "lucide-react";
export function Out({ href, children, className = "", newTab = true }) {
  return (
    <a
      className={className}
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noreferrer" : undefined}
    >
      {children}
      <ArrowUpRight size={18} />
    </a>
  );
}
