/**
 * A guess at whether a buyer is a woman or a man, from the name they typed.
 *
 * Nobody is asked their gender at checkout and nothing here is stored against
 * a person - this exists to answer one question in aggregate: who is buying,
 * so the advertising can be aimed at them. Treat the result as an estimate
 * with an honest unknown, never as a fact about anyone.
 *
 * Bulgarian family names carry the signal reliably: -ова / -ева / -ска are
 * women, -ов / -ев / -ски men, in Cyrillic and in the Latin spellings people
 * use abroad. Given names are the fallback, and foreign names mostly land in
 * "unknown", which is the right answer rather than a coin toss.
 */
export type Gender = "f" | "m" | null;

const FEMALE_SURNAME = /(ова|ева|ска|цка|ина)$/i;
const MALE_SURNAME = /(ов|ев|ски|цки|ин)$/i;
const FEMALE_SURNAME_LAT = /(ova|eva|ska|tska|ina)$/i;
const MALE_SURNAME_LAT = /(ov|ev|ski|tski|in)$/i;

/** Men whose given name ends the way a woman's usually does. */
const MALE_GIVEN = new Set([
  "никола", "илия", "добрина", "коста", "мишо", "сава", "тома", "лука", "андрея",
  "борислава", "слава", "кина",
].map((s) => s.toLowerCase()));
const MALE_GIVEN_EXACT = new Set(["никола", "илия", "коста", "сава", "тома", "лука", "андрея", "nikola", "iliya", "kosta", "sava", "toma", "luka"]);

const FEMALE_GIVEN_END = /(а|я|a|ya)$/i;

export function guessGender(fullName: string | null | undefined): Gender {
  const name = (fullName ?? "").trim();
  if (!name) return null;
  const parts = name.split(/\s+/).filter((p) => p.length > 1);
  if (parts.length === 0) return null;

  // The family name first: it is the strongest signal Bulgarian names carry.
  const last = parts[parts.length - 1];
  if (FEMALE_SURNAME.test(last) || FEMALE_SURNAME_LAT.test(last)) return "f";
  if (MALE_SURNAME.test(last) || MALE_SURNAME_LAT.test(last)) return "m";

  // Then the given name, with the handful of men it would misread.
  const first = parts[0].toLowerCase();
  if (MALE_GIVEN_EXACT.has(first)) return "m";
  if (FEMALE_GIVEN_END.test(first) && !MALE_GIVEN.has(first)) return "f";

  // A foreign name with no ending we can read stays unknown on purpose.
  return null;
}

export function genderSplit(names: (string | null)[]): { female: number; male: number; unknown: number } {
  let female = 0;
  let male = 0;
  let unknown = 0;
  for (const n of names) {
    const g = guessGender(n);
    if (g === "f") female++;
    else if (g === "m") male++;
    else unknown++;
  }
  return { female, male, unknown };
}
