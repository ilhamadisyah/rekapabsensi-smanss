'use client';

import React from 'react';
import { CalculationGuideModal } from '@/components/calculation-guide-modal';

export default function PanduanPublicPage() {
  return (
    <div className="min-h-screen bg-slate-100/70 p-4 sm:p-6 lg:p-8 print:p-0 print:bg-white flex flex-col justify-start">
      {/* Main Content Area: Calculation Guide Component */}
      <main className="max-w-7xl mx-auto w-full print:p-0 print:max-w-none">
        <CalculationGuideModal
          isOpen={true}
          onClose={() => {}}
          isEmbeddedView={true}
        />
      </main>
    </div>
  );
}
