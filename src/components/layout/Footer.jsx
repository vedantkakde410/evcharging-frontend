import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-6">

        <div className="flex items-center gap-2 text-green-600 font-bold text-xl">
          <Zap />
          EVCharge
        </div>

        <p className="text-slate-500 text-sm">
          © 2026 EVCharge. All rights reserved.
        </p>

      </div>
    </footer>
  );
}