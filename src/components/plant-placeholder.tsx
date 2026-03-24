export default function PlantPlaceholder() {
  return (
    <div className="flex aspect-video w-full items-center justify-center overflow-hidden bg-muted">
      <svg width="60" height="60" viewBox="0 0 80 80" fill="none" className="text-muted-foreground/40" aria-hidden="true">
        <ellipse cx="40" cy="70" rx="20" ry="4" fill="currentColor" />
        <rect x="37" y="30" width="6" height="40" rx="3" fill="currentColor" />
        <ellipse cx="40" cy="24" rx="14" ry="18" fill="currentColor" />
        <ellipse cx="22" cy="40" rx="8" ry="12" fill="currentColor" transform="rotate(-20 22 40)" />
        <ellipse cx="58" cy="40" rx="8" ry="12" fill="currentColor" transform="rotate(20 58 40)" />
      </svg>
    </div>
  );
}
