// Category accent colours from DESIGN.md; dark text on pink/orange keeps 11px labels readable.
const STYLES = {
  Technical: "bg-accent-purple text-white",
  Cultural: "bg-accent-pink text-ink",
  Sports: "bg-accent-orange text-ink",
  Workshop: "bg-brand-green-dark text-white",
  Seminar: "bg-accent-blue text-white",
};

export default function CategoryTag({ category }) {
  return (
    <span className={`eyebrow inline-block w-fit rounded-xs px-2 py-0.5 ${STYLES[category] ?? "bg-steel text-white"}`}>
      {category}
    </span>
  );
}
