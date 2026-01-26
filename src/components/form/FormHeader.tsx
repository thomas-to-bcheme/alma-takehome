'use client';

import { FORM_REVISION } from '@/lib/constants';

export function FormHeader(): React.JSX.Element {
  return (
    <header className="border-b-2 border-[#003366] bg-[#fafafa] p-4">
      <div className="flex items-center justify-between">
        {/* Left: Logo placeholder */}
        <div className="flex h-20 w-20 items-center justify-center border-2 border-[#003366]">
          <span className="text-xs text-zinc-400">Logo</span>
        </div>

        {/* Center: Title and subtitle */}
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold text-[#003366]">Form A-28</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Legal Services Documentation
          </p>
        </div>

        {/* Right: Revision date */}
        <div className="text-right">
          <span className="text-sm text-zinc-500">{FORM_REVISION}</span>
        </div>
      </div>
    </header>
  );
}
