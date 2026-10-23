/** Line-art arched window with an oak sprig — the Haven mark. */
export function ArchMark({ size = 56, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 54V28a14 14 0 0 1 28 0v26z" />
      <path d="M22 54V29a10 10 0 0 1 20 0v25" opacity="0.45" />
      <path d="M12 54h40" />
      <path d="M32 50V27" />
      <path d="M32 33c-4.6-.6-7.6-3.4-8-7.6 4.6.4 7.6 3.2 8 7.6z" />
      <path d="M32 40c4.6-.6 7.6-3.4 8-7.6-4.6.4-7.6 3.2-8 7.6z" />
      <path d="M32 46c-4-.5-6.6-3-7-6.6 4 .4 6.6 2.8 7 6.6z" />
      <circle cx="35.5" cy="44.5" r="1.6" />
    </svg>
  );
}
