/**
 * Bulgarian names in Latin letters, for the English pages.
 *
 * The official transliteration (Наредба за транслитерацията), plus the
 * academic titles that travel with a name in a programme. Anything already
 * in Latin passes through untouched, so a mixed line-up needs no marking
 * up. Where a person spells their own name differently in English, add it
 * to OVERRIDES - their spelling wins over the rule.
 */

const MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s",
  т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sht",
  ъ: "a", ь: "y", ю: "yu", я: "ya",
};

const TITLES: [RegExp, string][] = [
  [/^Акад\.?\s+проф\.?\s+д-р\s+/i, "Acad. Prof. Dr "],
  [/^Чл\.?-кор\.?\s+проф\.?\s+д-р\s+/i, "Corr. Mem. Prof. Dr "],
  [/^Член-кор\.?\s+проф\.?\s+д-р\s+/i, "Corr. Mem. Prof. Dr "],
  [/^Проф\.?\s+д-р\s+/i, "Prof. Dr "],
  [/^Доц\.?\s+д-р\s+/i, "Assoc. Prof. Dr "],
  [/^Акад\.?\s+/i, "Acad. "],
  [/^Проф\.?\s+/i, "Prof. "],
  [/^Доц\.?\s+/i, "Assoc. Prof. "],
  [/^Д-р\s+/i, "Dr "],
];

/** Their own spelling, where it differs from the rule. */
const OVERRIDES: Record<string, string> = {
  "Шима Мехрабиян": "Shima Mehrabian",
  "Шима Мехрабиян-Спасова": "Shima Mehrabian-Spasova",
  "Иван Койчев": "Ivan Koychev",
  "Мария Силвестър": "Maria Silvester",
  "Джулия Димитрова": "Julia Dimitrova",
  "Мария Варсанова": "Maria Varsanova",
};

function word(w: string): string {
  // The official rule: a word ending in -ия ends in -ia, not -iya.
  const base = w.endsWith("ия") ? `${w.slice(0, -2)}иа` : w;
  return [...base]
    .map((ch) => {
      const lower = ch.toLowerCase();
      const mapped = MAP[lower];
      if (!mapped) return ch;
      return ch === lower ? mapped : mapped.charAt(0).toUpperCase() + mapped.slice(1);
    })
    .join("");
}

export function latin(input: string): string {
  if (!/[Ѐ-ӿ]/.test(input)) return input;
  let s = input;
  for (const [re, replacement] of TITLES) {
    if (re.test(s)) {
      s = s.replace(re, replacement);
      break;
    }
  }
  const [prefix, rest] = /^[A-Za-z.\s-]+/.test(s) ? [s.match(/^[A-Za-z.\s-]+/)![0], s.slice(s.match(/^[A-Za-z.\s-]+/)![0].length)] : ["", s];
  const override = OVERRIDES[rest.trim()];
  if (override) return `${prefix}${override}`;
  return prefix + rest.split(/(\s+|-)/).map((part) => (/[Ѐ-ӿ]/.test(part) ? word(part) : part)).join("");
}
