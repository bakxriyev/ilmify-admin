'use client';

import { AIProvider } from './AIContext';
import { AIChatWidget } from './AIChatWidget';
import { AIDashboardModal } from './AIDashboardModal';

export function AIAssistant() {
  return (
    <AIProvider>
      <AIDashboardModal />
      <AIChatWidget />
    </AIProvider>
  );
}
