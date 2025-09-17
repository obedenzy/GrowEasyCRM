'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Shield, BarChart3, Users, ArrowRight, CheckCircle, Zap, Globe, MessageSquare, Phone, Mail, TrendingUp, Target, Calendar, PieChart, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: <Users className="h-8 w-8 text-blue-500" />,
      title: "Customer Relationship Management",
      description: "Centralize all customer interactions, track communications, and build stronger relationships with intelligent contact management.",
      color: "from-blue-500/20 to-cyan-500/20"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-green-500" />,
      title: "Sales Pipeline Management",
      description: "Track deals from lead to close with visual pipelines, automated follow-ups, and sales performance analytics.",
      color: "from-green-500/20 to-emerald-500/20"
    },
    {
      icon: <Target className="h-8 w-8 text-purple-500" />,
      title: "Marketing Automation",
      description: "Create targeted campaigns, automate email sequences, and nurture leads with personalized marketing workflows.",
      color: "from-purple-500/20 to-pink-500/20"
    },
    {
      icon: <Star className="h-8 w-8 text-yellow-500" />,
      title: "Reputation Management",
      description: "Protect and enhance your online reputation with smart review filtering and customer feedback management.",
      color: "from-yellow-500/20 to-orange-500/20"
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-indigo-500" />,
      title: "Business Analytics",
      description: "Comprehensive insights into sales performance, customer behavior, and marketing ROI with real-time dashboards.",
      color: "from-indigo-500/20 to-purple-500/20"
    },
    {
      icon: <Calendar className="h-8 w-8 text-rose-500" />,
      title: "Appointment Scheduling",
      description: "Streamline bookings with integrated calendar management, automated reminders, and customer self-scheduling.",
      color: "from-rose-500/20 to-pink-500/20"
    }
  ];

  const stats = [
    { label: "Businesses Growing", value: "10,000+", icon: <TrendingUp className="h-5 w-5" /> },
    { label: "Deals Closed", value: "500K+", icon: <DollarSign className="h-5 w-5" /> },
    { label: "Revenue Growth", value: "+157%", icon: <BarChart3 className="h-5 w-5" /> },
    { label: "Customer Satisfaction", value: "98%", icon: <CheckCircle className="h-5 w-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Grow Easy
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-200">
            <Zap className="h-4 w-4 mr-1" />
            All-in-One Business Growth Platform
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent leading-tight">
            Grow Your Business
            <br />
            <span className="text-blue-600">Effortlessly</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            The complete CRM, Sales & Marketing platform designed for modern businesses. Manage customers, close deals, automate marketing, and grow your revenue—all from one powerful dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-2">
                <Globe className="mr-2 h-5 w-5" />
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-2 text-blue-600">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              Everything You Need to Grow Your Business
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Complete CRM, Sales & Marketing automation in one integrated platform
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer border-0 bg-gradient-to-br ${feature.color} backdrop-blur-sm`}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg bg-white/80 transition-transform duration-300 ${hoveredFeature === index ? 'scale-110' : ''}`}>
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-700 text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Ready to Accelerate Your Business Growth?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using Grow Easy to streamline operations and boost revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-4">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Grow Easy</span>
              </div>
              <p className="text-gray-400">
                Complete CRM, Sales & Marketing platform for growing businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white">CRM Features</Link></li>
                <li><Link href="/sales" className="hover:text-white">Sales Tools</Link></li>
                <li><Link href="/marketing" className="hover:text-white">Marketing</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-white">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/support" className="hover:text-white">Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Grow Easy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}