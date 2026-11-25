interface SearchResultCountProps {
  count: number;
  singular: string;
  plural: string;
}

export function SearchResultCount({ count, singular, plural }: SearchResultCountProps) {
  return (
    <div className="flex items-center justify-between border-b-2 border-foreground/10 pb-2">
      <span className="text-xs font-bold text-foreground/60">
        {count} {count === 1 ? singular : plural}
      </span>
    </div>
  );
}
