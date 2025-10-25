import React, { useState } from "react";

const onboardingSteps = [
  {
    title: "Welcome to Auterity Unified!",
    description:
      "This platform lets you build, monitor, and optimize AI workflows with ease. Let’s take a quick tour!",
  },
  {
    title: "Dashboard Overview",
    description:
      "Monitor workflow health, execution stats, and agent/server status in real time.",
  },
  {
    title: "Workflow Builder",
    description:
      "Use the visual builder to create, edit, and test workflows with drag-and-drop simplicity.",
  },
  {
    title: "Notifications & Quick Actions",
    description:
      "Get instant feedback and take action directly from the notification center and dashboard.",
  },
  {
    title: "Need Help?",
    description:
      "Access documentation, support, and tips anytime from the help menu.",
  },
];

export const OnboardingOverlay: React.FC = () => {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const current = onboardingSteps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h2 className="text-xl font-bold mb-2">{current.title}</h2>
        <p className="text-gray-700 mb-6">{current.description}</p>
        <div className="flex justify-between">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={() => setVisible(false)}
          >
            Skip
          </button>
          {step < onboardingSteps.length - 1 ? (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => setStep(step + 1)}
            >
              Next
            </button>
          ) : (
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={() => setVisible(false)}
            >
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


