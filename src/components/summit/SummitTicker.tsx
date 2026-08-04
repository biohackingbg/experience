const items = [
  "Сцена — знанието",
  "Лаборатория — числата",
  "Ритуали — тялото",
  "Village — брандовете",
];

export function SummitTicker() {
  // Duplicated once so the -50% translate loops seamlessly.
  const loop = [...items, ...items];

  return (
    <div className="overflow-hidden bg-bh-lime py-4 text-bh-ink">
      <div className="flex w-max bh-marquee">
        {loop.map((item, i) => (
          <span
            key={i}
            className="flex shrink-0 items-center font-display text-sm font-extrabold uppercase tracking-tight"
          >
            {item}
            <span className="mx-6 text-bh-forest">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
