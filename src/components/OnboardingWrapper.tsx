"use client";

import React from 'react';
import { useAuth } from "@/contexts/AuthContext";
import OnboardingTutorial from "@/components/OnboardingTutorial";

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

export default function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const { showOnboarding, setShowOnboarding } = useAuth();

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <>
      {children}
      <OnboardingTutorial
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
}
