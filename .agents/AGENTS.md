# CarpoolProject Rules & Architectural Guidelines

Welcome to the CarpoolProject. This document serves as the ground truth for our project rules, architectural guidelines, folder structures, coding standards, and production-readiness requirements. All developers and AI agents must adhere to these standards.

---

## 1. Core Architecture: Clean Architecture Principles

To keep the application maintainable, testable, and independent of external libraries or frameworks, we apply Clean Architecture:

```
                  ┌──────────────────────────────┐
                  │           Entities           │  ◀── Core Business Logic (User, Ride, Trip)
                  └──────────────────────────────┘
                                  ▲
                  ┌──────────────────────────────┐
                  │          Use Cases           │  ◀── Application Business Rules
                  └──────────────────────────────┘
                                  ▲
                  ┌──────────────────────────────┐
                  │    Controllers/Presenters    │  ◀── Interface Adapters (NestJS Controllers, React Components)
                  └──────────────────────────────┘
                                  ▲
                  ┌──────────────────────────────┐
                  │    Frameworks & Drivers      │  ◀── Databases (MongoDB/Redis), Express/Vite, UI
                  └──────────────────────────────┘
```

### Key Rules
- **Dependency Rule**: Dependencies must always point inwards. High-level policy (Entities/Use Cases) must never depend on low-level details (database, UI, framework APIs).
- **Entities**: Business domain models and logic that represent core entities (e.g. User, Ride, Notification). They should contain only pure logic and data validation, free of external packages (like Mongoose/NestJS decorators in pure enterprise rules, though schema integration is handled in backend layers).
- **Use Cases / Services**: Orchestrate flow of data to and from entities. Keep business workflows isolated from the delivery mechanism (HTTP/gRPC/CLI).
- **Separation of Interface**: Keep HTTP controllers, database schemas, and external service connectors strictly distinct from domain cores. Use ports/interfaces/DTOs to decouple layers.

---

## 2. Backend Folder & File Structure (NestJS)

Our backend utilizes NestJS. To enforce modularity, each resource module resides in its own folder and follows a consistent layer hierarchy.

### Standard Module Layout
For any resource, eg. `rides`, the structure MUST be:
```
backend/src/rides/
├── dto/                             # Data Transfer Objects (DTOs)
│   ├── create-ride.dto.ts
│   └── update-ride.dto.ts
├── interfaces/                      # (Optional) TypeScript interfaces for data structure decoupling
├── ride.schema.ts                   # Mongoose / Database Schema & Model
├── rides.controller.ts              # HTTP Routes, endpoints, and validation bindings
├── rides.module.ts                  # NestJS Module definition, imports/exports, providers setup
└── rides.service.ts                 # Business use cases, data querying, and transactional logic
```

### Backend Implementation Rules
1. **Never leak database details**: Do not return raw database documents (with `_v` or internal database specifics) to the client. Map schemas to clean return types or DTOs.
2. **DTO Validation**: Use `class-validator` and `class-transformer` for strict payload validation in controllers.
3. **Services for Logic**: Controllers must only receive requests, trigger validation, delegate to services, and format responses. No database queries or business operations belong in controllers.
4. **Use Modules for DI**: Keep modules highly cohesive. Only export services that are needed in other modules.
5. **Caching & Queueing**: Keep heavy operations or operations requiring external API checks asynchronous. Use Redis caching where appropriate.

---

## 3. Frontend Architecture & Component Guidelines

Our React frontend must be structured, component-driven, and highly reusable.

### Folder Structure
```
frontend/src/
├── assets/                          # Static assets (images, vectors)
├── components/                      # Modular UI components
│   ├── auth/                        # Authentication views (Login, Register, OTP forms)
│   ├── common/                      # Reusable/generic components (Loaders, Modals, Dropdowns)
│   ├── layout/                      # Application structures (Header, Navigation, Sidebar)
│   ├── profile/                     # Profile settings subviews (Details, CarInfo, Addresses)
│   └── rides/                       # Ride-sharing specific components (RideCard, RideFilter, Forms)
├── context/                         # State management context providers (e.g., AppContext)
├── services/                        # API layers and utility classes
└── App.tsx                          # Base layout orchestrator
```

### Frontend Implementation Rules
1. **Component Separation**: Keep `App.tsx` small. If a view exceeds 150 lines or represents a distinct feature, extract it into a separate component under `components/`.
2. **Single Responsibility**: Each component should perform one task. For instance, `RideCard` displays details, while `RideFilter` handles search queries.
3. **Reusable Styles**: Use the design system tokens defined in `index.css` (variables like `--accent`, `--bg-primary`, etc.). Avoid hardcoded colors and styles where possible.
4. **Context for Global State**: Keep shared state (user session, notification counts, rides data) in context providers (`AppContext.tsx`). Avoid deep prop drilling.
5. **TypeScript Strictness**: Type all props explicitly. Avoid using `any` for props, states, or hook return values.

---

## 4. Production-Ready Checklist

To ensure the project is stable, secure, and ready for real users, the following production features must be present:

### A. Environment Configuration
- Use `.env` file templates (`.env.example`) and never check secrets into source control.
- Validate environment variables on startup (e.g., using NestJS Config module + Joi validation).

### B. Security & Validation
- **Helmet**: Set secure HTTP headers in NestJS.
- **CORS**: Configure strict Cross-Origin Resource Sharing rules.
- **Rate Limiting**: Protect endpoints against DDoS/brute-force attacks using throttling middleware (e.g., `nestjs/throttler` or Redis rate limiters).
- **Password Hashing**: Use bcrypt/argon2 for password hashing, never store plain text passwords.
- **JWT & Token Expiry**: Implement short-lived Access Tokens (JWT) and secure Refresh Tokens.

### C. Error Handling & Monitoring
- **Global Error Filters**: Implement global exception filters in NestJS to log errors and return standardized API error structures.
- **Dev vs Prod Errors**: Do not leak stack traces or internal configuration details to client apps in production. Keep logs informative but hidden behind user-friendly generic messages on the client side.
- **Logger**: Use structured logging (e.g., Winston, Pino) in the backend.

### D. Testing & Quality Assurance
- **Unit Tests**: Write unit tests for services using Jest. Target >80% coverage.
- **Linting**: Keep code clean using ESLint / Prettier rules.
- **Linter tools**: Run lightweight linters (`oxlint` in frontend) during pre-commit hooks or CI/CD checks.

### E. Frontend Performance & SEO
- **Optimized Bundles**: Verify tree-shaking works and bundle size is minimized.
- **Lazy Loading**: Lazy-load non-essential routes or modals.
- **Image Optimization**: Pre-size and optimize raster assets; prefer SVG format where possible.
- **Semantic HTML**: Use header tags, landmarks, and descriptive labels to ensure accessibility (a11y) and SEO friendliness.

---

## 5. Mandatory Rule: End-to-End Full-Stack Feature Development

Every feature developed or modified in CarpoolProject MUST be implemented end-to-end across all architectural tiers:
1. **Database Schema & Persistence**: Ensure Mongoose schemas, models, and indexes store and manage the required fields securely.
2. **Backend API & Business Logic**: Implement or update NestJS DTOs, controllers, services, validation pipes, and authentication/authorization guards.
3. **Frontend Application (React Native)**: Build/update user interfaces, components, state management, context, API service hooks, and visual feedback.

No feature or enhancement is considered complete unless verified across DB, API, and the React Native frontend application.

---

## 6. Mandatory Rule: Backend Render Redeployment Reminder

Whenever any changes, updates, bug fixes, or new endpoints/schemas are created or modified in the backend (`backend/`):
1. **Explicit Notification**: You MUST explicitly remind the user to commit and push code to Git (`git push`) so that Render automatically triggers a new production build and redeploys the backend server.
2. **Push Command Suggestion**: Always provide the recommended Git commands to stage, commit, and push the backend changes to ensure Render receives the updated backend code seamlessly.

---

## 7. Mandatory Rule: Component Design & UX Pattern Consistency Across the App

Whenever any component, screen, popup/modal, tab bar, card, or interaction pattern is created, modified, or reused across the app:
1. **Reuse Existing Design & UX Patterns**: If a component pattern (such as the animated tab switcher with sliding pill indicator from `HistoryScreen`, standard popup/modal structures, header badges, card containers, or action buttons) already exists in the app, you MUST reuse the exact same visual design, styling tokens, animations, and UX interaction patterns.
2. **Unified Aesthetics & Behavior**: Avoid creating ad-hoc, unstyled, or inconsistent variations of tabs, modals, popups, or cards. Shared components across screens must maintain identical styling (e.g. dark translucent surfaces `rgba(255, 255, 255, 0.04)`, cyan `#38BDF8` active glows/indicators, `#0F172A` popup dialog backgrounds with `borderRadius: 24`, and fluid spring animations).


