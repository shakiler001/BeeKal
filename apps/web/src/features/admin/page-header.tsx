export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-[1.6rem] font-bold tracking-[-0.03em]">{title}</h1>
        {description && <p className="text-ink-2 mt-1.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}
