/** Génère un fichier iCalendar (RFC 5545) pour un événement. */
const echapper = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
const utc = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Replie les lignes à 75 octets (RFC 5545 §3.1). */
function plier(ligne: string) {
  const octets = new TextEncoder();
  const morceaux: string[] = [];
  let courant = "";
  for (const c of ligne) {
    if (octets.encode(courant + c).length > (morceaux.length ? 74 : 75)) {
      morceaux.push(courant);
      courant = c;
    } else courant += c;
  }
  morceaux.push(courant);
  return morceaux.join("\r\n ");
}

export function fichierIcs(e: {
  slug: string;
  titre: string;
  resume: string;
  debut: Date;
  fin: Date;
  lieu: string;
  url: string;
  maj: Date;
}) {
  const lignes = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//vaugines terres vivantes//site//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.slug}@vaugines-terres-vivantes`,
    `DTSTAMP:${utc(e.maj)}`,
    `DTSTART:${utc(e.debut)}`,
    `DTEND:${utc(e.fin)}`,
    `SUMMARY:${echapper(e.titre)}`,
    `DESCRIPTION:${echapper(`${e.resume}\n\n${e.url}`)}`,
    `LOCATION:${echapper(e.lieu)}`,
    `URL:${e.url}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${echapper(e.titre)}`,
    "TRIGGER:-PT2H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lignes.map(plier).join("\r\n") + "\r\n";
}
