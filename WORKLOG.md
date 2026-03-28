# AWS Playground — Work Log

## How This Works
Alti evaluates the app against best practices, prioritizes work, builds it, self-assesses, and moves to the next item. No permission needed — just results.

## Evaluation Criteria
After each task, check against:
- **Functionality**: Does it work? Edge cases handled?
- **UX**: Intuitive? Professional? Would an SA use this daily?
- **Code quality**: Clean, typed, no dead code, proper error handling?
- **Performance**: No unnecessary re-renders, lazy loading where needed?
- **Accessibility**: Keyboard nav, screen readers, ARIA labels?
- **Security**: No API keys exposed, proper input validation?
- **Production readiness**: Could this deploy today?

## Task Queue (prioritized)
<!-- Mark [x] when complete, add commit hash -->

### P0 — Critical (app feels broken without these)
- [ ] Fix pre-existing TypeScript errors (useNodesState typing, AwsNodeData casts)
- [ ] Edge labels — connections show no info about the relationship
- [ ] Undo/redo — destructive actions with no recovery

### P1 — High Impact (professional quality)
- [ ] Keyboard shortcuts (Ctrl+S save, Ctrl+Z undo, Delete node, Ctrl+E export)
- [ ] Auto-layout / snap-to-grid improvements
- [ ] Connection edge context menu (edit config, delete, view IAM policy)
- [ ] Toast notifications for save/load/export actions
- [ ] Loading states and error boundaries

### P2 — Differentiation (what makes this special)
- [ ] Architecture templates (3-tier web app, serverless API, data lake, etc.)
- [ ] Cost estimation per architecture (AWS Pricing API)
- [ ] Terraform/CDK export alongside CloudFormation
- [ ] Well-Architected review — flag anti-patterns in the diagram
- [ ] Service search with keyboard navigation (Cmd+K)

### P3 — Polish
- [ ] Responsive design / mobile considerations
- [ ] Onboarding tour for first-time users
- [ ] Export diagram as PNG/SVG image
- [ ] Dark mode refinements
- [ ] Performance: virtualize large diagrams

## Completed
| Task | Commit | Date |
|------|--------|------|
| Ground AI in AWS Documentation | `50a7ff4` | 2026-03-28 |
| Wire save/load UI | `1861f8d` | 2026-03-28 |
| VPC/Subnet grouping | `4a1bb67` | 2026-03-28 |
