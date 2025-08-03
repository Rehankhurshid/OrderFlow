# Delivery Order Management System

## Overview

A role-based delivery order management system that routes documents through a defined workflow across different departments. The system implements strict access controls where each department can only perform their designated functions in the document lifecycle. Built with React frontend, Express backend, PostgreSQL database, and implements department-based authentication and authorization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with local strategy using session-based auth
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple
- **API Design**: RESTful API with role-based middleware for access control
- **Password Security**: Scrypt-based password hashing with salt

### Database Architecture
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Design**: 
  - Users table with department-based roles (paper_creator, project_office, area_office, road_sale, role_creator)
  - Parties table for delivery recipients
  - Delivery Orders table with status tracking
  - Workflow History table for audit trail
- **Access Patterns**: Department-specific queries to enforce data isolation

### Role-Based Access Control
- **Department Isolation**: Each department can only access documents at their current workflow stage
- **Workflow Enforcement**: Linear progression through departments (Paper Creator → Project Office → Area Office → Road Sale)
- **Action Restrictions**: Department-specific permissions (create, process, approve, reject)
- **Admin Functions**: Role creator can manage users but cannot interact with delivery orders

### Workflow Management
- **Document Lifecycle**: Delivery orders progress through predefined stages
- **Status Tracking**: Real-time status updates with current location tracking
- **Audit Trail**: Complete workflow history with performer tracking
- **Consumer Portal**: Public search functionality for delivery order status

### Security Features
- **Session Management**: Secure session handling with PostgreSQL storage
- **CSRF Protection**: Built-in protection through session configuration
- **Input Validation**: Zod schemas for both client and server-side validation
- **Department Verification**: Middleware ensures users can only access their department's data

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL connection pooling for serverless environments
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **express**: Web application framework
- **passport**: Authentication middleware with local strategy

### Frontend Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **react-hook-form**: Form state management and validation
- **@hookform/resolvers**: Zod integration for form validation
- **wouter**: Lightweight client-side routing

### Development Tools
- **vite**: Frontend build tool and development server
- **typescript**: Type checking and development experience
- **tailwindcss**: Utility-first CSS framework
- **drizzle-kit**: Database migration and schema management

### Production Considerations
- **connect-pg-simple**: PostgreSQL session store for production scaling
- **esbuild**: Backend bundling for production deployment
- Session security configured for production with trust proxy settings