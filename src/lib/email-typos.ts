/**
 * Catches the typos that cost a buyer their ticket: gmail.con, gmail.comm,
 * gmal.com. The address is syntactically valid, so nothing else notices - the
 * ticket mail leaves for a mailbox that does not exist and bounces.
 *
 * Only ever a suggestion: the buyer keeps the address they typed unless they
 * accept the correction. A domain we have never heard of is left alone, since a
 * company address is not a typo.
 */

const COMMON = [
  "gmail.com",
  "abv.bg",
  "mail.bg",
  "dir.bg",
  "yahoo.com",
  "yahoo.de",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "abv.bg",
  "gbg.bg",
  "live.com",
  "me.com",
  "proton.me",
  "protonmail.com",
];

/** Real domains that merely sit one letter from a common one. */
const REAL = new Set(["mail.com", "gmx.com", "gmx.de", "yahoo.co.uk", "yahoo.fr", "yahoo.it", "live.nl", "mail.ru", "email.com", "outlook.de", "hotmail.de", "hotmail.fr", "icloud.co"]);

/** The endings people mistype; "gmail.con" is a typo of a domain we know, so it is fixed domain-wide. */
const TLD_FIXES: Record<string, string> = { con: "com", comm: "com", cmo: "com", vom: "com", ocm: "com", cm: "com", cpm: "com", om: "com", bgg: "bg", bgs: "bg" };

function distance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

/** The address the buyer probably meant, or null when what they typed looks right. */
export function suggestEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at < 1 || at === email.length - 1) return null;
  const local = email.slice(0, at);
  let domain = email.slice(at + 1);
  if (COMMON.includes(domain) || REAL.has(domain)) return null;

  const dot = domain.lastIndexOf(".");
  const tld = dot >= 0 ? domain.slice(dot + 1) : "";
  const fixedTld = TLD_FIXES[tld];
  if (fixedTld) domain = `${domain.slice(0, dot)}.${fixedTld}`;
  if (COMMON.includes(domain)) return `${local}@${domain}`;

  let best: string | null = null;
  let bestD = 3;
  for (const known of COMMON) {
    const d = distance(domain, known);
    if (d < bestD) {
      bestD = d;
      best = known;
    }
  }
  // Two edits at most, and never from a name that is itself a different real domain.
  return best && bestD <= 2 && !REAL.has(domain) ? `${local}@${best}` : fixedTld ? `${local}@${domain}` : null;
}
