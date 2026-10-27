export default function Alert({ type = "error", children }) {
  if (!children) return null;
  const styles =
    type === "success"
      ? "border-brand-green-soft bg-surface-feature text-brand-green-dark"
      : "border-red-200 bg-red-50 text-red-800";
  return (
    <div role="alert" className={`rounded-md border px-4 py-3 text-sm font-medium ${styles}`}>
      {children}
    </div>
  );
}
