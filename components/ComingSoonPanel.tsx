export default function ComingSoonPanel({ label }: { label: string }) {
  return (
    <div className="border border-[#e0e0e0] px-6 py-12 flex flex-col items-center justify-center text-center">
      <p className="text-base font-semibold tracking-[0.04em] uppercase text-[#cccccc] mb-2">{label}</p>
      <p className="text-sm text-[#aaaaaa]">Coming soon</p>
    </div>
  );
}
