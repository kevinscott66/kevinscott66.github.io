/** Cloudflare may rewrite this public mail link before React hydrates.
 * Keep it a native HTML island: no app state or user input enters this markup.
 * Email obfuscation remains enabled, and React does not reconcile its children.
 */
const markup =
  '<a class="contact-link" href="mailto:hello@dobropalm.tech">hello@dobropalm.tech<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></a>';
export function ContactAddress() {
  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
