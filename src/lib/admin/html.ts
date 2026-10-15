import "server-only";

import sanitizeHtml from "sanitize-html";

/**
 * Nettoie le HTML produit par l'éditeur avant enregistrement : seules les
 * balises de mise en forme prévues sont gardées (pas de script, de style ni
 * d'attribut d'événement). Les liens externes s'ouvrent dans un nouvel onglet.
 */
export function nettoyerHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "h2", "h3", "strong", "em", "s", "ul", "ol", "li", "blockquote", "a", "img", "figure", "figcaption", "br", "hr"],
    allowedAttributes: {
      a: ["href", "target", "rel", "class"],
      img: ["src", "alt", "width", "height"],
    },
    allowedClasses: { a: ["terme"] },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    transformTags: {
      a: (tag, attribs) => {
        const externe = /^https?:\/\//.test(attribs.href ?? "");
        return {
          tagName: "a",
          attribs: externe ? { ...attribs, target: "_blank", rel: "noopener noreferrer" } : { ...attribs, target: "", rel: "" },
        };
      },
    },
    exclusiveFilter: (frame) => frame.tag === "img" && !frame.attribs.alt?.trim(),
  }).replace(/ (target|rel)=""/g, "");
}

/** Texte brut (temps de lecture, résumés, newsletter). */
export function texteBrut(html: string) {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
}
