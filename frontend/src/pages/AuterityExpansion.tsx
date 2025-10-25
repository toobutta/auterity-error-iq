import React, { useState } from "react";
import React, { useState } from "react";
import Layout from "../components/Layout";
import SmartTriageDashboard from "../components/auterity-expansion/SmartTriageDashboard";
import VectorSimilarityDashboard from "../components/auterity-expansion/VectorSimilarityDashboard";
import AutonomousAgentDashboard from "../components/auterity-expansion/AutonomousAgentDashboard";

const AuterityExpansion: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<
    "triage" | "vector" | "agents"
  >("triage");

  const features = [
    {
      id: "triage",
      name: "Smart Triage",
      description: "AI-powered workflow routing and intelligent task triage",
      icon: "🎯",
      component: SmartTriageDashboard,
    },
    {
      id: "vector",
      name: "Vector Similarity",
      description:
        "Duplicate detection and similarity analysis using vector embeddings",
      icon: "🧠",
      component: VectorSimilarityDashboard,
    },
    {
      id: "agents",
      name: "Autonomous Agents",
      description: "AI agent management and multi-agent coordination",
      icon: "🤖",
      component: AutonomousAgentDashboard,
    },
  ];

  const ActiveComponent =
    features.find((f) => f.id === activeFeature)?.component ||
    SmartTriageDashboard;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="glass-card p-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-automotive-primary to-automotive-secondary bg-clip-text text-transparent mb-2">
              Auterity AI Platform Expansion
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Advanced AI-powered workflow automation with intelligent triage,
              vector similarity detection, and autonomous agent coordination
            </p>
          </div>
        </div>

        {/* Feature Navigation */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-2 shadow-lg">
          <div className="flex space-x-2">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() =>
                  setActiveFeature(feature.id as "triage" | "vector" | "agents")
                }
                className={`flex-1 flex flex-col items-center justify-center p-6 rounded-lg transition-all duration-300 ${
                  activeFeature === feature.id
                    ? "bg-automotive-primary text-white shadow-lg transform scale-105"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-700"
                }`}
              >
                <span className="text-3xl mb-2">{feature.icon}</span>
                <h3 className="text-lg font-semibold mb-1">{feature.name}</h3>
                <p className="text-sm text-center opacity-90">
                  {feature.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Active Feature Content */}
        <div className="min-h-[600px]">
          <ActiveComponent />
        </div>

        {/* Feature Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Smart Triage System
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              AI-powered workflow routing with hybrid ML and rule-based logic
              for intelligent task classification
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 text-left">
              <li>• NLP-based content analysis</li>
              <li>• Confidence scoring and human override</li>
              <li>• Learning from triage results</li>
              <li>• Multi-tenant rule management</li>
            </ul>
          </div>

          <div className="glass-card p-6 text-center">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Vector Similarity Engine
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Real-time duplicate detection and similarity analysis using
              advanced vector embeddings
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 text-left">
              <li>• Multi-dimensional vector embeddings</li>
              <li>• Cosine similarity calculations</li>
              <li>• Automatic cluster detection</li>
              <li>• Content deduplication</li>
            </ul>
          </div>

          <div className="glass-card p-6 text-center">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Autonomous Agents
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Deployable AI agents with memory persistence and intelligent
              coordination
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 text-left">
              <li>• Domain-specific agent types</li>
              <li>• Persistent memory and learning</li>
              <li>• Multi-agent coordination</li>
              <li>• Performance monitoring</li>
            </ul>
          </div>
        </div>

        {/* Integration Benefits */}
        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">
            Platform Integration Benefits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-automotive-primary mb-3">
                Enhanced Workflow Intelligence
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>• Intelligent task routing based on content analysis</li>
                <li>• Automatic duplicate detection and prevention</li>
                <li>• AI-powered decision making and optimization</li>
                <li>• Continuous learning and improvement</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-automotive-primary mb-3">
                Operational Efficiency
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>• Reduced manual triage overhead</li>
                <li>• Faster workflow execution</li>
                <li>• Improved accuracy and consistency</li>
                <li>• Scalable AI agent deployment</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Technical Architecture */}
        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">
            Technical Architecture
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-3">🔧</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Backend Services
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                FastAPI-based microservices with SQLAlchemy ORM, PostgreSQL, and
                Redis for caching and queuing
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Frontend Components
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                React TypeScript components with Tailwind CSS, glassmorphism
                design, and responsive layouts
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">🚀</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                AI Integration
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                LiteLLM integration, custom model support, and vector similarity
                algorithms
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AuterityExpansion;


