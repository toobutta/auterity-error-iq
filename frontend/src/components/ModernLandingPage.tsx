import React from "react";
import { cn } from "../lib/utils";

// Modern landing page showcasing the sleek UI
const ModernLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
      {/* Hero Section with Glassmorphism */}
      <section className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-300 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-pink-300 dark:bg-pink-600 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="text-center space-y-8">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-2xl">
                EIQ
              </div>
            </div>

            {/* Hero Text */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Error-IQ
              </h1>
              <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-300 max-w-3xl mx-auto leading-relaxed">
                Intelligent error monitoring and resolution platform with
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">
                  {" "}
                  real-time insights
                </span>
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="glass px-8 py-4 rounded-2xl text-white font-semibold hover:bg-white/20 transition-all duration-300 border border-white/30 hover:border-white/50 shadow-xl hover:shadow-2xl hover:scale-105">
                🚀 Get Started
              </button>
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 rounded-2xl text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105">
                📊 View Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="glass rounded-2xl p-6 border border-white/20">
                <div className="text-3xl font-bold text-white mb-2">99.9%</div>
                <div className="text-white/80">Uptime Guarantee</div>
              </div>
              <div className="glass rounded-2xl p-6 border border-white/20">
                <div className="text-3xl font-bold text-white mb-2">
                  &lt;2ms
                </div>
                <div className="text-white/80">Response Time</div>
              </div>
              <div className="glass rounded-2xl p-6 border border-white/20">
                <div className="text-3xl font-bold text-white mb-2">10k+</div>
                <div className="text-white/80">Errors Resolved Daily</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white/50 dark:bg-black/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              Modern Error Monitoring
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
              Experience the next generation of error tracking with our sleek,
              intelligent platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 hover-lift">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-white mb-4">
                Smart Detection
              </h3>
              <p className="text-white/80 leading-relaxed">
                AI-powered error detection that learns from your patterns and
                prevents issues before they impact users.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 hover-lift">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-white mb-4">
                Real-time Alerts
              </h3>
              <p className="text-white/80 leading-relaxed">
                Instant notifications across multiple channels with intelligent
                routing and escalation policies.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 hover-lift">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-white mb-4">
                Advanced Analytics
              </h3>
              <p className="text-white/80 leading-relaxed">
                Comprehensive dashboards with trends, patterns, and actionable
                insights for continuous improvement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              Beautiful, Intuitive Interface
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
              A clean, modern dashboard that makes error monitoring a pleasure
            </p>
          </div>

          {/* Mock Dashboard */}
          <div className="glass rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  System Overview
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-white/80">Live</span>
                </div>
              </div>

              {/* Mock Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">127</div>
                  <div className="text-white/70 text-sm">Active Errors</div>
                  <div className="text-red-300 text-xs">-12% ↘️</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">1,453</div>
                  <div className="text-white/70 text-sm">Affected Users</div>
                  <div className="text-green-300 text-xs">-8% ↘️</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">23min</div>
                  <div className="text-white/70 text-sm">MTTR</div>
                  <div className="text-orange-300 text-xs">+15% ↗️</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">98.7%</div>
                  <div className="text-white/70 text-sm">Success Rate</div>
                  <div className="text-green-300 text-xs">+0.3% ↗️</div>
                </div>
              </div>
            </div>

            {/* Mock Error List */}
            <div className="space-y-3">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs">
                        critical
                      </span>
                      <span className="text-white/60 text-sm">ERR-001</span>
                    </div>
                    <div className="text-white">
                      Database connection timeout in checkout flow
                    </div>
                    <div className="text-white/60 text-sm">
                      34 occurrences • 2 min ago
                    </div>
                  </div>
                  <div className="text-white/60">→</div>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded text-xs">
                        high
                      </span>
                      <span className="text-white/60 text-sm">ERR-002</span>
                    </div>
                    <div className="text-white">
                      Memory leak detected in user session handler
                    </div>
                    <div className="text-white/60 text-sm">
                      12 occurrences • 5 min ago
                    </div>
                  </div>
                  <div className="text-white/60">→</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white/30 dark:bg-black/30">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="text-neutral-600 dark:text-neutral-400">
            © 2025 Error-IQ. Crafted with modern design principles.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ModernLandingPage;


