export function Wordmark() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-mest-blue flex items-center justify-center">
        <span className="text-white font-serif text-xl">M</span>
      </div>
      <div className="font-serif text-xl text-mest-ink">
        MEST<span className="text-mest-gold">.</span>Studio
      </div>
    </div>
  );
}
