/**
 * AWS Documentation grounding layer.
 * 
 * Fetches relevant documentation from the official AWS docs
 * to ground AI-generated connection analysis, IAM policies,
 * and CloudFormation templates in authoritative sources.
 */

const AWS_DOCS_SEARCH_URL = "https://docs.aws.amazon.com/search/doc-search.html";
const AWS_DOCS_BASE = "https://docs.aws.amazon.com";

// Map common service names to their docs URL prefixes and CFN namespaces
const SERVICE_DOCS_MAP: Record<string, { docsPath: string; cfnNamespace: string; searchName: string }> = {
  "Amazon EC2": { docsPath: "/AWSEC2/latest/UserGuide", cfnNamespace: "AWS::EC2", searchName: "Amazon Elastic Compute Cloud" },
  "AWS Lambda": { docsPath: "/lambda/latest/dg", cfnNamespace: "AWS::Lambda", searchName: "AWS Lambda" },
  "Amazon S3": { docsPath: "/AmazonS3/latest/userguide", cfnNamespace: "AWS::S3", searchName: "Amazon Simple Storage Service" },
  "Amazon RDS": { docsPath: "/AmazonRDS/latest/UserGuide", cfnNamespace: "AWS::RDS", searchName: "Amazon Relational Database Service" },
  "Amazon DynamoDB": { docsPath: "/amazondynamodb/latest/developerguide", cfnNamespace: "AWS::DynamoDB", searchName: "Amazon DynamoDB" },
  "Amazon VPC": { docsPath: "/vpc/latest/userguide", cfnNamespace: "AWS::EC2", searchName: "Amazon Virtual Private Cloud" },
  "Amazon CloudFront": { docsPath: "/AmazonCloudFront/latest/DeveloperGuide", cfnNamespace: "AWS::CloudFront", searchName: "Amazon CloudFront" },
  "Amazon SQS": { docsPath: "/AWSSimpleQueueService/latest/SQSDeveloperGuide", cfnNamespace: "AWS::SQS", searchName: "Amazon Simple Queue Service" },
  "Amazon SNS": { docsPath: "/sns/latest/dg", cfnNamespace: "AWS::SNS", searchName: "Amazon Simple Notification Service" },
  "Amazon ECS": { docsPath: "/AmazonECS/latest/developerguide", cfnNamespace: "AWS::ECS", searchName: "Amazon Elastic Container Service" },
  "Amazon EKS": { docsPath: "/eks/latest/userguide", cfnNamespace: "AWS::EKS", searchName: "Amazon Elastic Kubernetes Service" },
  "Amazon Aurora": { docsPath: "/AmazonRDS/latest/AuroraUserGuide", cfnNamespace: "AWS::RDS", searchName: "Amazon Aurora" },
  "Amazon ElastiCache": { docsPath: "/AmazonElastiCache/latest/UserGuide", cfnNamespace: "AWS::ElastiCache", searchName: "Amazon ElastiCache" },
  "Amazon API Gateway": { docsPath: "/apigateway/latest/developerguide", cfnNamespace: "AWS::ApiGateway", searchName: "Amazon API Gateway" },
  "AWS IAM": { docsPath: "/IAM/latest/UserGuide", cfnNamespace: "AWS::IAM", searchName: "AWS Identity and Access Management" },
  "Amazon Cognito": { docsPath: "/cognito/latest/developerguide", cfnNamespace: "AWS::Cognito", searchName: "Amazon Cognito" },
  "AWS Step Functions": { docsPath: "/step-functions/latest/dg", cfnNamespace: "AWS::StepFunctions", searchName: "AWS Step Functions" },
  "Amazon Kinesis": { docsPath: "/streams/latest/dev", cfnNamespace: "AWS::Kinesis", searchName: "Amazon Kinesis" },
  "Amazon Redshift": { docsPath: "/redshift/latest/mgmt", cfnNamespace: "AWS::Redshift", searchName: "Amazon Redshift" },
  "AWS Fargate": { docsPath: "/AmazonECS/latest/developerguide", cfnNamespace: "AWS::ECS", searchName: "AWS Fargate" },
  "Amazon Route 53": { docsPath: "/Route53/latest/DeveloperGuide", cfnNamespace: "AWS::Route53", searchName: "Amazon Route 53" },
  "AWS WAF": { docsPath: "/waf/latest/developerguide", cfnNamespace: "AWS::WAFv2", searchName: "AWS WAF" },
  "Amazon CloudWatch": { docsPath: "/AmazonCloudWatch/latest/monitoring", cfnNamespace: "AWS::CloudWatch", searchName: "Amazon CloudWatch" },
  "AWS KMS": { docsPath: "/kms/latest/developerguide", cfnNamespace: "AWS::KMS", searchName: "AWS Key Management Service" },
  "Amazon SES": { docsPath: "/ses/latest/dg", cfnNamespace: "AWS::SES", searchName: "Amazon Simple Email Service" },
  "Amazon EventBridge": { docsPath: "/eventbridge/latest/userguide", cfnNamespace: "AWS::Events", searchName: "Amazon EventBridge" },
  "AWS Glue": { docsPath: "/glue/latest/dg", cfnNamespace: "AWS::Glue", searchName: "AWS Glue" },
  "Amazon Athena": { docsPath: "/athena/latest/ug", cfnNamespace: "AWS::Athena", searchName: "Amazon Athena" },
  "Amazon Bedrock": { docsPath: "/bedrock/latest/userguide", cfnNamespace: "AWS::Bedrock", searchName: "Amazon Bedrock" },
  "Amazon SageMaker": { docsPath: "/sagemaker/latest/dg", cfnNamespace: "AWS::SageMaker", searchName: "Amazon SageMaker" },
  "Elastic Load Balancing": { docsPath: "/elasticloadbalancing/latest/application", cfnNamespace: "AWS::ElasticLoadBalancingV2", searchName: "Elastic Load Balancing" },
  "Auto Scaling": { docsPath: "/autoscaling/ec2/userguide", cfnNamespace: "AWS::AutoScaling", searchName: "Amazon EC2 Auto Scaling" },
};

interface DocSearchResult {
  url: string;
  title: string;
  context?: string;
  sections?: string[];
}

interface DocumentationContext {
  connectionDocs: string;
  cfnResourceDocs: string;
  iamDocs: string;
  sources: string[];
}

/**
 * Search AWS documentation via the official search API.
 * Uses a simple HTTP fetch — no MCP dependency at runtime.
 */
async function searchDocs(query: string, limit = 5): Promise<DocSearchResult[]> {
  try {
    const params = new URLSearchParams({
      searchQuery: query,
      is498: "true",
      locale: "en_us",
    });

    const resp = await fetch(`${AWS_DOCS_SEARCH_URL}?${params}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });

    if (!resp.ok) return [];

    const data = await resp.json();
    const items = data?.items?.slice(0, limit) || [];

    return items.map((item: Record<string, string>) => ({
      url: item.headURL || item.url || "",
      title: item.title || "",
      context: item.excerpt || item.context || "",
    }));
  } catch (err) {
    console.error("AWS docs search failed:", err);
    return [];
  }
}

/**
 * Fetch a specific AWS documentation page and extract text content.
 * Strips HTML tags for a lightweight text extraction.
 */
async function fetchDocPage(url: string, maxLength = 4000): Promise<string> {
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "text/html",
      },
    });

    if (!resp.ok) return "";

    const html = await resp.text();

    // Extract main content area
    const mainMatch = html.match(/<div id="main-col-body"[^>]*>([\s\S]*?)<\/div>\s*<div/);
    const content = mainMatch?.[1] || html;

    // Strip HTML tags, decode entities, normalize whitespace
    const text = content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, "\n```\n$1\n```\n")
      .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`")
      .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, "\n## $1\n")
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n- $1")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return text.slice(0, maxLength);
  } catch (err) {
    console.error(`Failed to fetch doc page ${url}:`, err);
    return "";
  }
}

/**
 * Get the CloudFormation resource type reference URL for a service.
 */
function getCfnResourceUrl(cfnType: string): string {
  if (!cfnType) return "";
  // e.g. AWS::Lambda::Function -> aws-lambda-function
  const slug = cfnType.toLowerCase().replace(/::/g, "-");
  return `https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/${slug}.html`;
}

/**
 * Gather documentation context for a connection between two AWS services.
 * This is the main entry point — call before sending to Claude.
 */
export async function getConnectionDocumentation(
  sourceService: string,
  targetService: string,
  sourceCfnType?: string,
  targetCfnType?: string
): Promise<DocumentationContext> {
  const sources: string[] = [];
  const docParts: string[] = [];
  const cfnParts: string[] = [];
  const iamParts: string[] = [];

  // 1. Search for integration documentation between the two services
  const integrationQuery = `${sourceService} ${targetService} integration configuration`;
  const searchResults = await searchDocs(integrationQuery, 3);

  for (const result of searchResults) {
    if (result.url && result.context) {
      sources.push(result.url);
      docParts.push(`[${result.title}](${result.url})\n${result.context}`);
    }
  }

  // 2. Search for IAM permissions between the services
  const iamQuery = `${sourceService} ${targetService} IAM policy permissions`;
  const iamResults = await searchDocs(iamQuery, 2);

  for (const result of iamResults) {
    if (result.url && result.context) {
      sources.push(result.url);
      iamParts.push(`[${result.title}](${result.url})\n${result.context}`);
    }
  }

  // 3. Fetch CloudFormation resource type docs
  if (sourceCfnType) {
    const cfnUrl = getCfnResourceUrl(sourceCfnType);
    const cfnContent = await fetchDocPage(cfnUrl, 3000);
    if (cfnContent) {
      sources.push(cfnUrl);
      cfnParts.push(`### ${sourceCfnType}\nSource: ${cfnUrl}\n${cfnContent}`);
    }
  }

  if (targetCfnType) {
    const cfnUrl = getCfnResourceUrl(targetCfnType);
    const cfnContent = await fetchDocPage(cfnUrl, 3000);
    if (cfnContent) {
      sources.push(cfnUrl);
      cfnParts.push(`### ${targetCfnType}\nSource: ${cfnUrl}\n${cfnContent}`);
    }
  }

  return {
    connectionDocs: docParts.length > 0
      ? docParts.join("\n\n---\n\n")
      : `No specific integration docs found for ${sourceService} → ${targetService}.`,
    cfnResourceDocs: cfnParts.length > 0
      ? cfnParts.join("\n\n---\n\n")
      : "",
    iamDocs: iamParts.length > 0
      ? iamParts.join("\n\n---\n\n")
      : "",
    sources: Array.from(new Set(sources)),
  };
}

/**
 * Gather documentation context for CloudFormation export.
 * Looks up CFN resource type docs for each service in the architecture.
 */
export async function getExportDocumentation(
  services: Array<{ name: string; cfnType?: string }>
): Promise<{ cfnDocs: string; sources: string[] }> {
  const sources: string[] = [];
  const cfnParts: string[] = [];

  // Deduplicate CFN types
  const uniqueTypes = Array.from(new Set(services.map(s => s.cfnType).filter(Boolean))) as string[];

  // Fetch resource type docs in parallel (max 6 concurrent to be polite)
  const chunks = [];
  for (let i = 0; i < uniqueTypes.length; i += 6) {
    chunks.push(uniqueTypes.slice(i, i + 6));
  }

  for (const chunk of chunks) {
    const results = await Promise.all(
      chunk.map(async (cfnType) => {
        const cfnUrl = getCfnResourceUrl(cfnType);
        const content = await fetchDocPage(cfnUrl, 2500);
        return { cfnType, cfnUrl, content };
      })
    );

    for (const { cfnType, cfnUrl, content } of results) {
      if (content) {
        sources.push(cfnUrl);
        cfnParts.push(`### ${cfnType}\nReference: ${cfnUrl}\n${content}`);
      }
    }
  }

  // Also search for best practices on multi-service CFN templates
  const bestPractices = await searchDocs("CloudFormation best practices template", 2);
  for (const result of bestPractices) {
    if (result.url && result.context) {
      sources.push(result.url);
      cfnParts.push(`### Best Practice: ${result.title}\n${result.url}\n${result.context}`);
    }
  }

  return {
    cfnDocs: cfnParts.join("\n\n---\n\n"),
    sources: Array.from(new Set(sources)),
  };
}
