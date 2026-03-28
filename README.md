# AWS Playground

A visual architecture design tool for AWS. Drag-and-drop services onto an interactive canvas, connect them, and export production-ready CloudFormation templates — powered by AI.

Think **draw.io meets AWS Well-Architected**, with Claude generating your infrastructure-as-code.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **Visual Canvas** — Drag-and-drop 90+ AWS services across 14 categories onto an interactive grid
- **Smart Connections** — Link services with handles on all 4 sides; AI generates config questions, IAM policies, and architecture notes for each connection
- **CloudFormation Export** — Generate complete CFN templates (YAML/JSON) from your diagram with one click
- **Service Catalog** — Compute, Storage, Database, Networking, Security, AI/ML, Analytics, and more
- **Search & Filter** — Find any AWS service instantly from the categorized sidebar
- **Persistence** — Save and load architectures (SQLite-backed REST API)
- **Dark/Light Theme** — Toggle between themes
- **MiniMap & Grid Snapping** — Professional diagramming experience
- **Per-Node Notes** — Annotate any service with context

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Canvas | ReactFlow (xyflow) |
| Backend | Express 5, SQLite, Drizzle ORM |
| AI | Anthropic Claude (connection analysis + CFN generation) |
| Icons | Official AWS Architecture Icons |

## Getting Started

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/AltivumInc/aws-playground.git
cd aws-playground

# Install dependencies
npm install

# Set your Anthropic API key
export ANTHROPIC_API_KEY=your-key-here

# Start development server
npm run dev
```

The app will be available at `http://localhost:5000`.

### Build for Production

```bash
npm run build
npm start
```

## Roadmap

- [ ] Wire save/load UI to existing API
- [ ] Undo/redo support
- [ ] Connection edge labels
- [ ] Terraform & CDK export
- [ ] VPC/subnet grouping boundaries
- [ ] Expanded service catalog (AgentCore, Q Developer, etc.)
- [ ] Design polish (glassmorphic treatment)
- [ ] Cost estimation per architecture
- [ ] Architecture templates (3-tier web app, serverless API, data lake, etc.)

## Contributing

Pull requests welcome. For major changes, please open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE)

---

Built by [Altivum Inc.](https://altivum.ai) 🏗️
