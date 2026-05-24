import { LegalDoc, downloadLegalDoc, downloadAllLegalDocs } from "@/lib/legal-content";
import { useState } from "react";

export function LegalDownloadBar({ doc }: { doc: LegalDoc }) {
  const [downloaded, setDownloaded] = useState<"this" | "all" | null>(null);

  const handleDownload = (type: "this" | "all") => {
    if (type === "this") downloadLegalDoc(doc);
    else downloadAllLegalDocs();
    setDownloaded(type);
    setTimeout(() => setDownloaded(null), 2500);
  };

  return (
    <div className="mb-6 p-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm flex items-center gap-2">
          ðŸ“¥ Download for your records
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Save a copy of this document or the full legal package as a text file.
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
        <button
          onClick={() => handleDownload("this")}
          className="flex-1 sm:flex-initial px-4 py-2 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-90 whitespace-nowrap"
          style={{ background: "#14B8A6" }}>
          {downloaded === "this" ? "âœ“ Downloaded" : `Download ${doc.title}`}
        </button>
        <button
          onClick={() => handleDownload("all")}
          className="flex-1 sm:flex-initial px-4 py-2 rounded-lg border border-primary text-primary text-xs font-semibold transition-colors hover:bg-primary/10 whitespace-nowrap">
          {downloaded === "all" ? "âœ“ Downloaded" : "Download All (4 docs)"}
        </button>
      </div>
    </div>
  );
}
