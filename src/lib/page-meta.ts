export function pageMeta(title: string, description: string) {
  return { meta: [{ title: `${title} — Form 146 Desk` }, { name: "description", content: description }, { property: "og:title", content: `${title} — Form 146 Desk` }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
}