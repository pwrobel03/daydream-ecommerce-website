import Link from "next/link";
export default function SuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <h1 className="text-6xl font-black italic uppercase text-primary">
        Success!
      </h1>
      <p className="font-black uppercase tracking-widest opacity-40">
        Payment received. Stock secured.
      </p>
      <Link href="/" className="underline font-bold">
        Back to homepage
      </Link>
    </div>
  );
}
