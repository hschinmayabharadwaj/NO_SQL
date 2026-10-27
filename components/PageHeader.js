import Link from "next/link";

// Dark-teal hero band used at the top of every page except home.
export default function PageHeader({ back, eyebrow, title, subtitle, children }) {
  return (
    <section className="band">
      <div className="container-page py-12 sm:py-16">
        {back && (
          <Link href={back.href} className="mb-6 inline-block text-sm font-medium text-muted hover:text-white">
            ← {back.label}
          </Link>
        )}
        {eyebrow && <div className="eyebrow mb-3 text-brand-green">{eyebrow}</div>}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl leading-[1.2] font-medium tracking-[-0.5px] sm:text-5xl">{title}</h1>
            {subtitle && <p className="mt-3 text-lg text-muted">{subtitle}</p>}
          </div>
          {children && <div className="flex flex-wrap gap-3">{children}</div>}
        </div>
      </div>
    </section>
  );
}
