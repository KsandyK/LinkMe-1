import React from "react";
import { Link } from "wouter";
import { downloadAllLegalDocs } from "../lib/legal-content";

export function Footer() {
  return (
    <footer className="bg-[#0A0C10] border-t border-[#222] py-10 text-sm text-muted-foreground">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Branding */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[#14B8A6] font-bold">Link</span>
            <span className="text-white font-bold">Me</span>
          </div>
          <p className="text-xs">18+ Adult Dating &amp; Live Interaction Platform</p>
          <p className="text-xs mt-2">© {new Date().getFullYear()} LinkMe Inc. All rights reserved.</p>
        </div>

        {/* Platform */}
        <div>
          <h4 className="font-semibold text-white mb-3">Platform</h4>
          <div className="space-y-1 text-xs">
            <Link href="/profiles" className="block hover:text-white">Browse Profiles</Link>
            <Link href="/live" className="block hover:text-white">Live Feeds</Link>
            <Link href="/become-creator" className="block hover:text-white">Become a Creator</Link>
          </div>
        </div>

        {/* Legal & Safety - NOW CLICKABLE */}
        <div>
          <h4 className="font-semibold text-white mb-3">Legal &amp; Safety</h4>
          <div className="space-y-1 text-xs">
            <Link href="/legal/terms" className="block hover:text-white">Terms of Service</Link>
            <Link href="/legal/privacy" className="block hover:text-white">Privacy Policy</Link>
            <Link href="/legal/code-of-conduct" className="block hover:text-white">Code of Conduct</Link>
            <Link href="/legal/creator-agreement" className="block hover:text-white">Creator Agreement &amp; NDA</Link>
            
            <button 
              onClick={downloadAllLegalDocs}
              className="flex items-center gap-2 text-[#14B8A6] hover:text-white mt-2"
            >
              📥 Download All Legal Docs
            </button>
          </div>
        </div>

        {/* Compliance Notice */}
        <div>
          <h4 className="font-semibold text-white mb-3">Compliance</h4>
          <p className="text-xs leading-relaxed">
            This platform is strictly for adults 18+. 
            All users must verify their age. 
            We maintain strict policies against CSAM, non-consensual content, and illegal material.
          </p>
          <p className="text-xs mt-2 text-red-400">Report abuse or illegal content immediately.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
