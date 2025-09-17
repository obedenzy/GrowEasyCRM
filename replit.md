# Overview

Grow Easy is an AI-powered review management platform designed for agencies and businesses to manage their online reputation. The application uses smart review filtering to automatically redirect positive reviews to Google while capturing negative feedback privately for resolution. The platform features a dual-tier architecture supporting both agency administrators who manage multiple clients and individual business accounts.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application is built using Next.js 13+ with the App Router architecture, providing server-side rendering and optimal performance. The frontend leverages React Server Components (RSC) for improved loading times and TypeScript for type safety. The UI is constructed using shadcn/ui components built on top of Radix UI primitives, ensuring accessibility and consistent design patterns.

## Design System
The styling approach combines Tailwind CSS for utility-first styling with CSS variables for theming support. The design system implements a neutral color palette with support for both light and dark modes. Component variants are managed through class-variance-authority (CVA) for consistent styling patterns across the application.

## State Management
The application uses React's built-in state management with hooks for local component state. Form handling is implemented using React Hook Form with Zod validation resolvers for robust form validation and submission handling.

## Authentication & Authorization
The system implements a role-based access control system with two primary user types:
- Agency administrators who can manage multiple subaccounts
- Subaccount administrators who manage individual business accounts

Authentication is implemented using NextAuth.js with JWT tokens and Supabase database integration for secure user management and session handling.

## Routing Architecture
The application uses Next.js App Router with a structured approach:
- `/auth/*` - Authentication pages (login, register)
- `/agency/*` - Agency administrator dashboard and functionality
- `/subaccount/*` - Individual business account management
- `/reviews/[...params]` - Public review collection interface

## Review Management System
The core functionality centers around intelligent review filtering:
- Public review collection pages accessible via unique URLs
- Rating-based routing (positive reviews → Google, negative reviews → private feedback)
- Internal review management dashboard for businesses
- Analytics and reporting capabilities

## Data Visualization
Charts and analytics are implemented using Recharts library, providing interactive data visualization for review trends, rating distributions, and business performance metrics.

## Payment Integration
Stripe integration is prepared for subscription management and payment processing, supporting the SaaS business model with different tiers for agencies and individual businesses.

# External Dependencies

## UI Framework Dependencies
- **@radix-ui/***: Complete set of accessible UI primitives for building the component system
- **shadcn/ui**: Pre-built component library providing consistent design patterns
- **lucide-react**: Icon library for consistent iconography throughout the application
- **tailwindcss**: Utility-first CSS framework for styling
- **class-variance-authority**: Type-safe variant management for component styling

## Form & Validation
- **react-hook-form**: Form state management and validation
- **@hookform/resolvers**: Validation resolvers for form integration
- **zod**: Schema validation for form inputs and data validation

## Data Visualization
- **recharts**: Chart library for analytics dashboards and data visualization
- **date-fns**: Date manipulation and formatting utilities

## UI Enhancement
- **embla-carousel-react**: Carousel implementation for UI components
- **sonner**: Toast notification system for user feedback
- **cmdk**: Command palette implementation for enhanced UX

## Payment Processing
- **@stripe/stripe-js**: Stripe integration for subscription and payment management

## Development Tools
- **typescript**: Type safety and enhanced development experience
- **eslint**: Code linting and quality assurance
- **autoprefixer**: CSS vendor prefix automation

## External Services Integration
- **Google Reviews API**: Integration for positive review redirection
- **Stripe Payment Platform**: Subscription billing and payment processing
- **Email Service Provider**: Planned integration for notification systems
- **SMS Gateway**: Planned integration for review request campaigns

The application is structured to easily integrate with additional third-party services as the platform scales, including CRM systems, marketing automation tools, and advanced analytics platforms.