import { ArrowUpRight } from "lucide-react";
export function Out({ href, children, className = "" }) {
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {children}
      <ArrowUpRight size={18} />
    </a>
  );
}
