import React from 'react';
import {
  Check,
  ChevronRight,
  Wallet,
  Banknote,
  Target,
  CreditCard,
  ClipboardList,
  Link2,
  DollarSign,
} from 'lucide-react';

export default function WizardStepper({ currentStep, onStepClick }) {
  // --- STEPS RE-NUMBERED (Now start at 2) ---
  const steps = [
    { number: 2, name: 'Bank Accounts', icon: Wallet },
    { number: 3, name: 'Income', icon: Banknote },
    { number: 4, name: 'Savings Goal', icon: Target },
    { number: 5, name: 'Debt Setup', icon: CreditCard },
    { number: 6, name: 'Categories', icon: ClipboardList },
    { number: 7, name: 'Link Debts', icon: Link2 },
    { number: 8, name: 'Assign Budget', icon: DollarSign },
    { number: 9, name: 'Complete!', icon: Check },
  ];
  // -----------------------

  return (
    <nav
      aria-label="Wizard steps"
      className="rounded-lg border border-gray-200 bg-white shadow-sm"
    >
      <ol className="flex flex-col divide-y divide-gray-200 md:flex-row md:divide-y-0">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;

          return (
            <li key={step.number} className="relative flex-1">
              <button
                onClick={() => onStepClick(step.number)}
                className="group flex w-full items-center p-4 text-left"
                disabled={step.number > currentStep} // Only allow going back
              >
                <span
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-medium ${
                    isActive
                      ? 'border-2 border-indigo-600 bg-white text-indigo-600'
                      : isCompleted
                      ? 'bg-indigo-600 text-white'
                      : 'border-2 border-gray-300 bg-white text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </span>
                <span className="ml-4 flex min-w-0 flex-col">
                  <span className="text-sm font-medium">{step.name}</span>
                </span>
              </button>

              {/* Arrow connector */}
              {index !== steps.length - 1 ? (
                <div
                  className="absolute top-0 right-0 hidden h-full w-5 md:block"
                  aria-hidden="true"
                >
                  <ChevronRight
                    className="h-full w-full text-gray-300"
                    aria-hidden="true"
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}