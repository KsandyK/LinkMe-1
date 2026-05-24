import { TERMS_OF_SERVICE, downloadLegalDoc } from "../../lib/legal-content";
import { Link } from "wouter";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-sm text-muted-foreground hover:text-white">← Back to Home</Link>
        <div className="mt-6 bg-[#111214] rounded-2xl p-10 border border-[#222]">
          <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
          <pre className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">{TERMS_OF_SERVICE}</pre>
        </div>
        <button onClick={() => downloadLegalDoc("terms")} className="mt-6 px-6 py-3 rounded-xl bg-[#14B8A6] text-white font-medium">Download Terms of Service</button>
      </div>
    </div>
  );
}
