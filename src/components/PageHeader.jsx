export default function PageHeader({ title, description, children }) {
  return <div className="page-heading"><div><div className="eyebrow mb-2">CITY OF ELMINA / OPERATIONS</div><h1>{title}</h1><p className="mt-2 text-sm text-neutral-500">{description}</p></div>{children}</div>;
}
