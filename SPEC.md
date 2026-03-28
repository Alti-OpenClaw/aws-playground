# AWS Playground — Product Specification v1.0

> **This document is immutable.** It defines what "done" looks like.
> Do not modify this file during development. If the spec needs to change,
> Chris approves it and a new version is created.

## Vision
The definitive visual AWS architecture design tool. Drag-and-drop services,
connect them with AI-guided configuration grounded in official AWS documentation,
and export production-ready infrastructure-as-code. Professional enough for
Solutions Architects studying for certs. Accurate enough to deploy from.

## End State Requirements

### 1. Canvas & Diagramming
- [ ] Drag-and-drop 90+ AWS services from categorized sidebar
- [ ] Search/filter services by name, category, or description
- [ ] Visual boundary grouping: Region → VPC → Subnet → AZ → Security Group
- [ ] Boundaries are resizable, nestable, and visually distinct
- [ ] Services auto-parent when dropped inside a boundary
- [ ] Connection handles on all 4 sides of every node
- [ ] Animated directional edges with arrow markers
- [ ] Edge labels showing relationship type (e.g. "HTTPS", "IAM Role", "VPC Peering")
- [ ] MiniMap showing full architecture overview
- [ ] Grid snapping for clean alignment
- [ ] Undo/redo with full state history
- [ ] Keyboard shortcuts: Ctrl+Z undo, Ctrl+Shift+Z redo, Delete remove, Ctrl+S save, Ctrl+E export
- [ ] Select multiple nodes (shift+click or drag select)
- [ ] Copy/paste nodes and groups
- [ ] Dark and light theme with system preference detection

### 2. AI-Powered Analysis (Grounded in AWS Docs)
- [ ] Connection prompts: when linking services, AI generates config questions, IAM policies, and architecture notes
- [ ] All AI responses cite official AWS documentation URLs
- [ ] Documentation sources displayed in the UI with clickable links
- [ ] IAM policies use exact documented actions (not hallucinated)
- [ ] CloudFormation hints reference real CFN resource types and properties
- [ ] Connection config answers persist and feed into export

### 3. Infrastructure-as-Code Export
- [ ] CloudFormation export in YAML and JSON
- [ ] Templates use correct CFN resource types and property names from docs
- [ ] Proper IAM roles/policies for every connection
- [ ] VPC/subnet/security group configuration when boundaries are used
- [ ] Sensible default parameters for configurable values
- [ ] DependsOn relationships where needed
- [ ] Outputs for important ARNs and endpoints
- [ ] Metadata section listing documentation sources
- [ ] Template validates against cfn-lint (no structural errors)
- [ ] Copy to clipboard and download file options

### 4. Persistence
- [ ] Save architecture with name and description
- [ ] Load from list of saved architectures
- [ ] Overwrite existing saves
- [ ] Delete saved architectures
- [ ] All state persists: nodes, edges, connection configs, boundary hierarchy
- [ ] Timestamps (created/updated) shown in load dialog
- [ ] Auto-save indicator (unsaved changes warning)

### 5. UX & Polish
- [ ] Toast notifications for all user actions (save, load, export, delete, errors)
- [ ] Loading states for all async operations
- [ ] Error boundaries that don't crash the whole app
- [ ] Empty states with clear calls to action
- [ ] Responsive toolbar that doesn't overflow
- [ ] Professional typography and spacing
- [ ] Smooth animations and transitions
- [ ] No console errors in production build
- [ ] Accessibility: keyboard navigation, ARIA labels, focus management

### 6. Code Quality
- [ ] Zero TypeScript errors (strict mode)
- [ ] No `any` types in application code (UI library types excluded)
- [ ] Proper error handling on all API calls
- [ ] No dead code or unused imports
- [ ] Consistent file naming and code style
- [ ] Components under 300 lines (split if larger)
- [ ] Clean git history with descriptive commit messages

### 7. Performance
- [ ] Initial load under 3 seconds
- [ ] Smooth canvas interaction with 50+ nodes
- [ ] No unnecessary re-renders (React.memo, useMemo, useCallback where appropriate)
- [ ] Lazy load dialogs and heavy components
- [ ] Bundle size under 500KB gzipped

### 8. Security
- [ ] No API keys in client-side code
- [ ] Input validation on all API endpoints
- [ ] Sanitized user input in templates
- [ ] CORS configured properly
- [ ] No sensitive data in error messages

## Non-Goals (v1.0)
These are explicitly out of scope for this version:
- Multi-user collaboration / real-time sync
- User authentication / accounts
- Terraform or CDK export (future version)
- Cost estimation (future version)
- Architecture templates library (future version)
- Mobile-optimized layout
- Deployment pipeline / CI/CD
- Backend hosting (runs locally)

## Scoring
Each section above is scored 0-100 based on completion percentage.
The app is "done" when every section scores ≥ 90.
Overall score = weighted average:
- Canvas & Diagramming: 25%
- AI Analysis: 20%
- IaC Export: 15%
- Persistence: 10%
- UX & Polish: 15%
- Code Quality: 10%
- Performance: 3%
- Security: 2%
