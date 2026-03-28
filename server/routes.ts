import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { Anthropic } from "@anthropic-ai/sdk";
import { getConnectionDocumentation, getExportDocumentation } from "./aws-docs";

const anthropic = new Anthropic();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // AI-powered connection prompts — grounded in AWS documentation
  app.post("/api/connection-prompts", async (req, res) => {
    try {
      const { sourceService, targetService, sourceCategory, targetCategory, sourceCfnType, targetCfnType } = req.body;
      
      // Fetch relevant AWS documentation BEFORE calling Claude
      console.log(`[aws-docs] Fetching documentation for ${sourceService} → ${targetService}...`);
      const docs = await getConnectionDocumentation(sourceService, targetService, sourceCfnType, targetCfnType);
      console.log(`[aws-docs] Found ${docs.sources.length} documentation sources`);

      const message = await anthropic.messages.create({
        model: "claude_sonnet_4_6",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: `You are an AWS Solutions Architect expert. A user is connecting "${sourceService}" to "${targetService}" in an AWS architecture diagram.

IMPORTANT: Base your response on the following OFFICIAL AWS DOCUMENTATION. Do not guess — use the documentation provided. If the docs don't cover something specific, say so in a note.

## AWS Documentation: Integration & Configuration
${docs.connectionDocs}

## AWS Documentation: IAM Policies
${docs.iamDocs || "No specific IAM documentation found. Use AWS best practices for least privilege."}

## AWS Documentation: CloudFormation Resource Types
${docs.cfnResourceDocs || "No specific CFN resource docs found."}

Based on the above documentation, generate a JSON response with:
1. "questions" - An array of 2-4 critical configuration questions they need to answer for this connection. Each question should have:
   - "id": a unique string identifier
   - "question": the question text
   - "type": "select" | "multiselect" | "text" | "boolean"  
   - "options": array of option strings (for select/multiselect only)
   - "default": the recommended default value
   - "explanation": brief explanation of why this matters (cite the AWS doc when possible)

2. "notes" - An array of 1-3 important reminders/warnings for this specific connection. Each note should have:
   - "severity": "info" | "warning" | "critical"
   - "text": the note content (reference specific AWS documentation when applicable)

3. "iamPolicy" - A minimal IAM policy statement JSON that would be needed for this connection (as a string). Use the exact IAM actions from the AWS documentation.

4. "cloudformationHint" - A brief description of what CloudFormation resources would be needed, referencing the actual CFN resource types from the docs.

5. "sources" - An array of the AWS documentation URLs that informed your response: ${JSON.stringify(docs.sources)}

Respond ONLY with valid JSON, no markdown code blocks or extra text.`
          }
        ]
      });

      const content = message.content[0];
      if (content.type === "text") {
        try {
          const parsed = JSON.parse(content.text);
          // Always include the documentation sources
          parsed.sources = docs.sources;
          res.json(parsed);
        } catch {
          res.json({
            questions: [
              {
                id: "permissions",
                question: `What IAM permissions should ${sourceService} have for ${targetService}?`,
                type: "text",
                default: "Minimal required permissions",
                explanation: "Follow the principle of least privilege"
              }
            ],
            notes: [
              {
                severity: "info",
                text: `Ensure proper networking and security group configuration between ${sourceService} and ${targetService}.`
              }
            ],
            iamPolicy: "{}",
            cloudformationHint: `Configure ${sourceService} to ${targetService} integration resource`,
            sources: docs.sources
          });
        }
      }
    } catch (error: any) {
      console.error("AI prompt error:", error);
      res.status(500).json({ error: "Failed to generate connection prompts" });
    }
  });

  // CloudFormation export — grounded in AWS documentation
  app.post("/api/export-cloudformation", async (req, res) => {
    try {
      const { nodes, edges, connectionConfigs, format } = req.body;
      
      // Extract service info from nodes for documentation lookup
      const services = (nodes || []).map((n: any) => ({
        name: n.data?.label || n.data?.service?.name || "",
        cfnType: n.data?.service?.cfnType || n.data?.cfnType || "",
      })).filter((s: any) => s.name);

      // Fetch CloudFormation documentation for all services in the diagram
      console.log(`[aws-docs] Fetching CFN documentation for ${services.length} services...`);
      const docs = await getExportDocumentation(services);
      console.log(`[aws-docs] Found ${docs.sources.length} CFN documentation sources`);

      const message = await anthropic.messages.create({
        model: "claude_sonnet_4_6",
        max_tokens: 8192,
        messages: [
          {
            role: "user",
            content: `You are an AWS Solutions Architect expert. Generate a complete, valid AWS CloudFormation template based on this architecture diagram.

IMPORTANT: Use the OFFICIAL AWS CLOUDFORMATION DOCUMENTATION below for correct resource types, property names, and allowed values. Do not guess property names — refer to the documentation.

## Official CloudFormation Resource Type Documentation
${docs.cfnDocs || "No specific CFN docs retrieved. Use standard CloudFormation resource types."}

## Architecture Diagram

ARCHITECTURE NODES (AWS Services):
${JSON.stringify(nodes, null, 2)}

CONNECTIONS BETWEEN SERVICES:
${JSON.stringify(edges, null, 2)}

CONNECTION CONFIGURATIONS (user answers to prompts):
${JSON.stringify(connectionConfigs, null, 2)}

Generate a production-ready CloudFormation template in ${format === 'yaml' ? 'YAML' : 'JSON'} format.

Requirements:
- Use the EXACT property names and resource types from the AWS documentation above
- Include ALL necessary resources for each service node
- Configure proper IAM roles and policies for each connection (use documented IAM actions)
- Include security groups, VPC configuration where appropriate
- Add sensible default parameters for configurable values
- Include outputs for important resource ARNs and endpoints
- Add proper DependsOn where needed
- Include comments explaining each section with references to AWS docs
- Add a Metadata section listing the documentation sources used

The template should be immediately deployable with \`aws cloudformation deploy\`.

Documentation sources used: ${JSON.stringify(docs.sources)}

Respond ONLY with the raw ${format === 'yaml' ? 'YAML' : 'JSON'} template content, no markdown code blocks or explanation.`
          }
        ]
      });

      const content = message.content[0];
      if (content.type === "text") {
        res.json({ template: content.text, format, sources: docs.sources });
      }
    } catch (error: any) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Failed to generate CloudFormation template" });
    }
  });

  // Architecture CRUD
  app.get("/api/architectures", async (_req, res) => {
    const archs = await storage.getArchitectures();
    res.json(archs);
  });

  app.get("/api/architectures/:id", async (req, res) => {
    const arch = await storage.getArchitecture(Number(req.params.id));
    if (!arch) return res.status(404).json({ error: "Not found" });
    res.json(arch);
  });

  app.post("/api/architectures", async (req, res) => {
    const arch = await storage.createArchitecture(req.body);
    res.json(arch);
  });

  app.put("/api/architectures/:id", async (req, res) => {
    const arch = await storage.updateArchitecture(Number(req.params.id), req.body);
    if (!arch) return res.status(404).json({ error: "Not found" });
    res.json(arch);
  });

  app.delete("/api/architectures/:id", async (req, res) => {
    await storage.deleteArchitecture(Number(req.params.id));
    res.json({ ok: true });
  });

  return httpServer;
}
