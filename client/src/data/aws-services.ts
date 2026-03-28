export interface AwsService {
  id: string;
  name: string;
  shortName: string;
  category: string;
  description: string;
  iconSlug: string; // thesvg CDN slug
  color: string;
  cfnType?: string;
}

export interface ServiceCategory {
  name: string;
  color: string;
  icon: string;
  services: AwsService[];
}

// CDN base for thesvg.org AWS architecture icons
const CDN_BASE = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons";

export function getServiceIconUrl(iconSlug: string): string {
  return `${CDN_BASE}/${iconSlug}/default.svg`;
}

export const awsServices: AwsService[] = [
  // COMPUTE
  { id: "ec2", name: "Amazon EC2", shortName: "EC2", category: "Compute", description: "Virtual servers in the cloud", iconSlug: "aws-amazon-ec2", color: "#ED7100", cfnType: "AWS::EC2::Instance" },
  { id: "lambda", name: "AWS Lambda", shortName: "Lambda", category: "Compute", description: "Run code without thinking about servers", iconSlug: "aws-aws-lambda", color: "#ED7100", cfnType: "AWS::Lambda::Function" },
  { id: "ecs", name: "Amazon ECS", shortName: "ECS", category: "Compute", description: "Run containerized applications", iconSlug: "aws-amazon-elastic-container-service", color: "#ED7100", cfnType: "AWS::ECS::Service" },
  { id: "eks", name: "Amazon EKS", shortName: "EKS", category: "Compute", description: "Managed Kubernetes service", iconSlug: "aws-amazon-elastic-kubernetes-service", color: "#ED7100", cfnType: "AWS::EKS::Cluster" },
  { id: "fargate", name: "AWS Fargate", shortName: "Fargate", category: "Compute", description: "Serverless compute for containers", iconSlug: "aws-aws-fargate", color: "#ED7100", cfnType: "AWS::ECS::Service" },
  { id: "elastic-beanstalk", name: "AWS Elastic Beanstalk", shortName: "Beanstalk", category: "Compute", description: "Deploy and scale web apps", iconSlug: "aws-aws-elastic-beanstalk", color: "#ED7100", cfnType: "AWS::ElasticBeanstalk::Application" },
  { id: "batch", name: "AWS Batch", shortName: "Batch", category: "Compute", description: "Batch processing at any scale", iconSlug: "aws-aws-batch", color: "#ED7100", cfnType: "AWS::Batch::JobDefinition" },
  { id: "auto-scaling", name: "Auto Scaling", shortName: "ASG", category: "Compute", description: "Scale compute capacity automatically", iconSlug: "aws-amazon-ec2-auto-scaling", color: "#ED7100", cfnType: "AWS::AutoScaling::AutoScalingGroup" },

  // STORAGE
  { id: "s3", name: "Amazon S3", shortName: "S3", category: "Storage", description: "Object storage built to retrieve any amount of data", iconSlug: "aws-amazon-simple-storage-service", color: "#3F8624", cfnType: "AWS::S3::Bucket" },
  { id: "ebs", name: "Amazon EBS", shortName: "EBS", category: "Storage", description: "Block storage for EC2", iconSlug: "aws-amazon-elastic-block-store", color: "#3F8624", cfnType: "AWS::EC2::Volume" },
  { id: "efs", name: "Amazon EFS", shortName: "EFS", category: "Storage", description: "Managed file storage for EC2", iconSlug: "aws-amazon-elastic-file-system", color: "#3F8624", cfnType: "AWS::EFS::FileSystem" },
  { id: "glacier", name: "S3 Glacier", shortName: "Glacier", category: "Storage", description: "Long-term low-cost archive storage", iconSlug: "aws-amazon-simple-storage-service-glacier", color: "#3F8624", cfnType: "AWS::S3::Bucket" },
  { id: "fsx", name: "Amazon FSx", shortName: "FSx", category: "Storage", description: "Fully managed third-party file systems", iconSlug: "aws-amazon-fsx", color: "#3F8624", cfnType: "AWS::FSx::FileSystem" },
  { id: "storage-gateway", name: "AWS Storage Gateway", shortName: "Storage GW", category: "Storage", description: "Hybrid cloud storage", iconSlug: "aws-aws-storage-gateway", color: "#3F8624" },
  { id: "backup", name: "AWS Backup", shortName: "Backup", category: "Storage", description: "Centralized backup across AWS services", iconSlug: "aws-aws-backup", color: "#3F8624" },

  // DATABASE
  { id: "rds", name: "Amazon RDS", shortName: "RDS", category: "Database", description: "Managed relational database service", iconSlug: "aws-amazon-rds", color: "#3B48CC", cfnType: "AWS::RDS::DBInstance" },
  { id: "aurora", name: "Amazon Aurora", shortName: "Aurora", category: "Database", description: "High performance managed relational database", iconSlug: "aws-amazon-aurora", color: "#3B48CC", cfnType: "AWS::RDS::DBCluster" },
  { id: "dynamodb", name: "Amazon DynamoDB", shortName: "DynamoDB", category: "Database", description: "Managed NoSQL database", iconSlug: "aws-amazon-dynamodb", color: "#3B48CC", cfnType: "AWS::DynamoDB::Table" },
  { id: "elasticache", name: "Amazon ElastiCache", shortName: "ElastiCache", category: "Database", description: "In-memory caching service", iconSlug: "aws-amazon-elasticache", color: "#3B48CC", cfnType: "AWS::ElastiCache::CacheCluster" },
  { id: "neptune", name: "Amazon Neptune", shortName: "Neptune", category: "Database", description: "Fully managed graph database", iconSlug: "aws-amazon-neptune", color: "#3B48CC", cfnType: "AWS::Neptune::DBCluster" },
  { id: "redshift", name: "Amazon Redshift", shortName: "Redshift", category: "Database", description: "Cloud data warehouse", iconSlug: "aws-amazon-redshift", color: "#3B48CC", cfnType: "AWS::Redshift::Cluster" },
  { id: "documentdb", name: "Amazon DocumentDB", shortName: "DocumentDB", category: "Database", description: "MongoDB-compatible document database", iconSlug: "aws-amazon-documentdb", color: "#3B48CC", cfnType: "AWS::DocDB::DBCluster" },
  { id: "keyspaces", name: "Amazon Keyspaces", shortName: "Keyspaces", category: "Database", description: "Managed Cassandra-compatible database", iconSlug: "aws-amazon-keyspaces", color: "#3B48CC" },
  { id: "timestream", name: "Amazon Timestream", shortName: "Timestream", category: "Database", description: "Serverless time series database", iconSlug: "aws-amazon-timestream", color: "#3B48CC" },
  { id: "qldb", name: "Amazon QLDB", shortName: "QLDB", category: "Database", description: "Fully managed ledger database", iconSlug: "aws-amazon-quantum-ledger-database", color: "#3B48CC" },

  // NETWORKING
  { id: "vpc", name: "Amazon VPC", shortName: "VPC", category: "Networking", description: "Isolated cloud resources", iconSlug: "aws-amazon-virtual-private-cloud", color: "#8C4FFF", cfnType: "AWS::EC2::VPC" },
  { id: "cloudfront", name: "Amazon CloudFront", shortName: "CloudFront", category: "Networking", description: "Global CDN service", iconSlug: "aws-amazon-cloudfront", color: "#8C4FFF", cfnType: "AWS::CloudFront::Distribution" },
  { id: "route53", name: "Amazon Route 53", shortName: "Route 53", category: "Networking", description: "Scalable DNS and domain registration", iconSlug: "aws-amazon-route-53", color: "#8C4FFF", cfnType: "AWS::Route53::HostedZone" },
  { id: "api-gateway", name: "Amazon API Gateway", shortName: "API GW", category: "Networking", description: "Create, maintain, and secure APIs", iconSlug: "aws-amazon-api-gateway", color: "#8C4FFF", cfnType: "AWS::ApiGateway::RestApi" },
  { id: "elb", name: "Elastic Load Balancing", shortName: "ELB/ALB", category: "Networking", description: "Distribute incoming traffic", iconSlug: "aws-elastic-load-balancing", color: "#8C4FFF", cfnType: "AWS::ElasticLoadBalancingV2::LoadBalancer" },
  { id: "direct-connect", name: "AWS Direct Connect", shortName: "Direct Connect", category: "Networking", description: "Dedicated network connection to AWS", iconSlug: "aws-aws-direct-connect", color: "#8C4FFF" },
  { id: "global-accelerator", name: "AWS Global Accelerator", shortName: "Global Accel", category: "Networking", description: "Improve application availability", iconSlug: "aws-aws-global-accelerator", color: "#8C4FFF" },
  { id: "transit-gateway", name: "AWS Transit Gateway", shortName: "Transit GW", category: "Networking", description: "Connect VPCs and on-premises networks", iconSlug: "aws-aws-transit-gateway", color: "#8C4FFF" },
  { id: "privatelink", name: "AWS PrivateLink", shortName: "PrivateLink", category: "Networking", description: "Private connectivity to services", iconSlug: "aws-aws-privatelink", color: "#8C4FFF" },
  { id: "app-mesh", name: "AWS App Mesh", shortName: "App Mesh", category: "Networking", description: "Application-level networking", iconSlug: "aws-aws-app-mesh", color: "#8C4FFF" },

  // SECURITY
  { id: "iam", name: "AWS IAM", shortName: "IAM", category: "Security", description: "Manage access to AWS services", iconSlug: "aws-aws-identity-and-access-management", color: "#DD344C", cfnType: "AWS::IAM::Role" },
  { id: "cognito", name: "Amazon Cognito", shortName: "Cognito", category: "Security", description: "User identity and access management", iconSlug: "aws-amazon-cognito", color: "#DD344C", cfnType: "AWS::Cognito::UserPool" },
  { id: "kms", name: "AWS KMS", shortName: "KMS", category: "Security", description: "Managed encryption keys", iconSlug: "aws-aws-key-management-service", color: "#DD344C", cfnType: "AWS::KMS::Key" },
  { id: "secrets-manager", name: "AWS Secrets Manager", shortName: "Secrets Mgr", category: "Security", description: "Rotate, manage, and retrieve secrets", iconSlug: "aws-aws-secrets-manager", color: "#DD344C", cfnType: "AWS::SecretsManager::Secret" },
  { id: "waf", name: "AWS WAF", shortName: "WAF", category: "Security", description: "Web application firewall", iconSlug: "aws-aws-waf", color: "#DD344C", cfnType: "AWS::WAFv2::WebACL" },
  { id: "shield", name: "AWS Shield", shortName: "Shield", category: "Security", description: "DDoS protection", iconSlug: "aws-aws-shield", color: "#DD344C" },
  { id: "guardduty", name: "Amazon GuardDuty", shortName: "GuardDuty", category: "Security", description: "Intelligent threat detection", iconSlug: "aws-amazon-guardduty", color: "#DD344C" },
  { id: "inspector", name: "Amazon Inspector", shortName: "Inspector", category: "Security", description: "Automated security assessment", iconSlug: "aws-amazon-inspector", color: "#DD344C" },
  { id: "security-hub", name: "AWS Security Hub", shortName: "Security Hub", category: "Security", description: "Unified security and compliance", iconSlug: "aws-aws-security-hub", color: "#DD344C" },
  { id: "certificate-manager", name: "AWS ACM", shortName: "ACM", category: "Security", description: "Provision SSL/TLS certificates", iconSlug: "aws-aws-certificate-manager", color: "#DD344C", cfnType: "AWS::CertificateManager::Certificate" },
  { id: "macie", name: "Amazon Macie", shortName: "Macie", category: "Security", description: "Discover and protect sensitive data", iconSlug: "aws-amazon-macie", color: "#DD344C" },

  // APPLICATION INTEGRATION
  { id: "sns", name: "Amazon SNS", shortName: "SNS", category: "App Integration", description: "Pub/sub messaging and mobile notifications", iconSlug: "aws-amazon-simple-notification-service", color: "#E7157B", cfnType: "AWS::SNS::Topic" },
  { id: "sqs", name: "Amazon SQS", shortName: "SQS", category: "App Integration", description: "Managed message queues", iconSlug: "aws-amazon-simple-queue-service", color: "#E7157B", cfnType: "AWS::SQS::Queue" },
  { id: "eventbridge", name: "Amazon EventBridge", shortName: "EventBridge", category: "App Integration", description: "Serverless event bus", iconSlug: "aws-amazon-eventbridge", color: "#E7157B", cfnType: "AWS::Events::Rule" },
  { id: "step-functions", name: "AWS Step Functions", shortName: "Step Fn", category: "App Integration", description: "Visual workflow service", iconSlug: "aws-aws-step-functions", color: "#E7157B", cfnType: "AWS::StepFunctions::StateMachine" },
  { id: "appsync", name: "AWS AppSync", shortName: "AppSync", category: "App Integration", description: "Managed GraphQL service", iconSlug: "aws-aws-appsync", color: "#E7157B", cfnType: "AWS::AppSync::GraphQLApi" },
  { id: "mq", name: "Amazon MQ", shortName: "MQ", category: "App Integration", description: "Managed message broker", iconSlug: "aws-amazon-mq", color: "#E7157B" },
  { id: "msk", name: "Amazon MSK", shortName: "MSK", category: "App Integration", description: "Managed streaming for Apache Kafka", iconSlug: "aws-amazon-managed-streaming-for-apache-kafka", color: "#E7157B" },

  // AI/ML
  { id: "sagemaker", name: "Amazon SageMaker", shortName: "SageMaker", category: "AI/ML", description: "Build, train, and deploy ML models", iconSlug: "aws-amazon-sagemaker", color: "#01A88D", cfnType: "AWS::SageMaker::Model" },
  { id: "bedrock", name: "Amazon Bedrock", shortName: "Bedrock", category: "AI/ML", description: "Foundation models as a service", iconSlug: "aws-amazon-bedrock", color: "#01A88D" },
  { id: "rekognition", name: "Amazon Rekognition", shortName: "Rekognition", category: "AI/ML", description: "Image and video analysis", iconSlug: "aws-amazon-rekognition", color: "#01A88D" },
  { id: "comprehend", name: "Amazon Comprehend", shortName: "Comprehend", category: "AI/ML", description: "NLP service", iconSlug: "aws-amazon-comprehend", color: "#01A88D" },
  { id: "lex", name: "Amazon Lex", shortName: "Lex", category: "AI/ML", description: "Conversational AI for chatbots", iconSlug: "aws-amazon-lex", color: "#01A88D" },
  { id: "polly", name: "Amazon Polly", shortName: "Polly", category: "AI/ML", description: "Text to speech", iconSlug: "aws-amazon-polly", color: "#01A88D" },
  { id: "transcribe", name: "Amazon Transcribe", shortName: "Transcribe", category: "AI/ML", description: "Speech to text", iconSlug: "aws-amazon-transcribe", color: "#01A88D" },
  { id: "translate", name: "Amazon Translate", shortName: "Translate", category: "AI/ML", description: "Natural and fluent language translation", iconSlug: "aws-amazon-translate", color: "#01A88D" },
  { id: "textract", name: "Amazon Textract", shortName: "Textract", category: "AI/ML", description: "Extract text and data from documents", iconSlug: "aws-amazon-textract", color: "#01A88D" },
  { id: "kendra", name: "Amazon Kendra", shortName: "Kendra", category: "AI/ML", description: "Intelligent search service", iconSlug: "aws-amazon-kendra", color: "#01A88D" },

  // ANALYTICS
  { id: "athena", name: "Amazon Athena", shortName: "Athena", category: "Analytics", description: "Query data in S3 using SQL", iconSlug: "aws-amazon-athena", color: "#8C4FFF", cfnType: "AWS::Athena::WorkGroup" },
  { id: "kinesis", name: "Amazon Kinesis", shortName: "Kinesis", category: "Analytics", description: "Real-time data streaming", iconSlug: "aws-amazon-kinesis", color: "#8C4FFF", cfnType: "AWS::Kinesis::Stream" },
  { id: "glue", name: "AWS Glue", shortName: "Glue", category: "Analytics", description: "ETL and data catalog", iconSlug: "aws-aws-glue", color: "#8C4FFF", cfnType: "AWS::Glue::Job" },
  { id: "emr", name: "Amazon EMR", shortName: "EMR", category: "Analytics", description: "Big data processing", iconSlug: "aws-amazon-emr", color: "#8C4FFF", cfnType: "AWS::EMR::Cluster" },
  { id: "quicksight", name: "Amazon QuickSight", shortName: "QuickSight", category: "Analytics", description: "Business intelligence service", iconSlug: "aws-amazon-quicksight", color: "#8C4FFF" },
  { id: "lake-formation", name: "AWS Lake Formation", shortName: "Lake Formation", category: "Analytics", description: "Build secure data lakes", iconSlug: "aws-aws-lake-formation", color: "#8C4FFF" },
  { id: "opensearch", name: "Amazon OpenSearch", shortName: "OpenSearch", category: "Analytics", description: "Search and analytics engine", iconSlug: "aws-amazon-opensearch-service", color: "#8C4FFF" },

  // MANAGEMENT
  { id: "cloudwatch", name: "Amazon CloudWatch", shortName: "CloudWatch", category: "Management", description: "Monitor resources and applications", iconSlug: "aws-amazon-cloudwatch", color: "#E7157B", cfnType: "AWS::CloudWatch::Alarm" },
  { id: "cloudformation", name: "AWS CloudFormation", shortName: "CloudFormation", category: "Management", description: "Infrastructure as code", iconSlug: "aws-aws-cloudformation", color: "#E7157B", cfnType: "AWS::CloudFormation::Stack" },
  { id: "cloudtrail", name: "AWS CloudTrail", shortName: "CloudTrail", category: "Management", description: "Track user activity and API usage", iconSlug: "aws-aws-cloudtrail", color: "#E7157B" },
  { id: "config", name: "AWS Config", shortName: "Config", category: "Management", description: "Track resource configurations", iconSlug: "aws-aws-config", color: "#E7157B" },
  { id: "systems-manager", name: "AWS Systems Manager", shortName: "Systems Mgr", category: "Management", description: "Operational hub for AWS", iconSlug: "aws-aws-systems-manager", color: "#E7157B" },
  { id: "organizations", name: "AWS Organizations", shortName: "Organizations", category: "Management", description: "Central governance for AWS accounts", iconSlug: "aws-aws-organizations", color: "#E7157B" },
  { id: "trusted-advisor", name: "AWS Trusted Advisor", shortName: "Trusted Advisor", category: "Management", description: "Optimize AWS environment", iconSlug: "aws-aws-trusted-advisor", color: "#E7157B" },

  // DEVELOPER TOOLS
  { id: "codecommit", name: "AWS CodeCommit", shortName: "CodeCommit", category: "Developer Tools", description: "Managed source control", iconSlug: "aws-aws-codecommit", color: "#3B48CC" },
  { id: "codebuild", name: "AWS CodeBuild", shortName: "CodeBuild", category: "Developer Tools", description: "Build and test code", iconSlug: "aws-aws-codebuild", color: "#3B48CC", cfnType: "AWS::CodeBuild::Project" },
  { id: "codepipeline", name: "AWS CodePipeline", shortName: "CodePipeline", category: "Developer Tools", description: "Continuous delivery", iconSlug: "aws-aws-codepipeline", color: "#3B48CC", cfnType: "AWS::CodePipeline::Pipeline" },
  { id: "codedeploy", name: "AWS CodeDeploy", shortName: "CodeDeploy", category: "Developer Tools", description: "Automate code deployments", iconSlug: "aws-aws-codedeploy", color: "#3B48CC" },
  { id: "xray", name: "AWS X-Ray", shortName: "X-Ray", category: "Developer Tools", description: "Analyze and debug applications", iconSlug: "aws-aws-x-ray", color: "#3B48CC" },

  // CONTAINERS
  { id: "ecr", name: "Amazon ECR", shortName: "ECR", category: "Containers", description: "Container image registry", iconSlug: "aws-amazon-elastic-container-registry", color: "#ED7100", cfnType: "AWS::ECR::Repository" },

  // FRONTEND & MOBILE
  { id: "amplify", name: "AWS Amplify", shortName: "Amplify", category: "Frontend", description: "Build full-stack web and mobile apps", iconSlug: "aws-aws-amplify", color: "#ED7100" },
  { id: "ses", name: "Amazon SES", shortName: "SES", category: "Frontend", description: "Email sending service", iconSlug: "aws-amazon-simple-email-service", color: "#ED7100", cfnType: "AWS::SES::EmailIdentity" },
  { id: "pinpoint", name: "Amazon Pinpoint", shortName: "Pinpoint", category: "Frontend", description: "Multichannel marketing", iconSlug: "aws-amazon-pinpoint", color: "#ED7100" },

  // IoT
  { id: "iot-core", name: "AWS IoT Core", shortName: "IoT Core", category: "IoT", description: "Connect IoT devices to the cloud", iconSlug: "aws-aws-iot-core", color: "#01A88D" },
  { id: "iot-greengrass", name: "AWS IoT Greengrass", shortName: "Greengrass", category: "IoT", description: "Local compute for devices", iconSlug: "aws-aws-iot-greengrass", color: "#01A88D" },

  // MIGRATION
  { id: "dms", name: "AWS DMS", shortName: "DMS", category: "Migration", description: "Database migration service", iconSlug: "aws-aws-database-migration-service", color: "#3F8624" },
  { id: "snowball", name: "AWS Snowball", shortName: "Snowball", category: "Migration", description: "Large-scale data transport", iconSlug: "aws-aws-snowball", color: "#3F8624" },
  { id: "datasync", name: "AWS DataSync", shortName: "DataSync", category: "Migration", description: "Online data transfer", iconSlug: "aws-aws-datasync", color: "#3F8624" },
];

export const serviceCategories: ServiceCategory[] = [
  { name: "Compute", color: "#ED7100", icon: "Cpu", services: awsServices.filter(s => s.category === "Compute") },
  { name: "Storage", color: "#3F8624", icon: "HardDrive", services: awsServices.filter(s => s.category === "Storage") },
  { name: "Database", color: "#3B48CC", icon: "Database", services: awsServices.filter(s => s.category === "Database") },
  { name: "Networking", color: "#8C4FFF", icon: "Network", services: awsServices.filter(s => s.category === "Networking") },
  { name: "Security", color: "#DD344C", icon: "Shield", services: awsServices.filter(s => s.category === "Security") },
  { name: "App Integration", color: "#E7157B", icon: "Webhook", services: awsServices.filter(s => s.category === "App Integration") },
  { name: "AI/ML", color: "#01A88D", icon: "Brain", services: awsServices.filter(s => s.category === "AI/ML") },
  { name: "Analytics", color: "#8C4FFF", icon: "BarChart3", services: awsServices.filter(s => s.category === "Analytics") },
  { name: "Management", color: "#E7157B", icon: "Settings", services: awsServices.filter(s => s.category === "Management") },
  { name: "Developer Tools", color: "#3B48CC", icon: "Code", services: awsServices.filter(s => s.category === "Developer Tools") },
  { name: "Containers", color: "#ED7100", icon: "Container", services: awsServices.filter(s => s.category === "Containers") },
  { name: "Frontend", color: "#ED7100", icon: "Monitor", services: awsServices.filter(s => s.category === "Frontend") },
  { name: "IoT", color: "#01A88D", icon: "Wifi", services: awsServices.filter(s => s.category === "IoT") },
  { name: "Migration", color: "#3F8624", icon: "MoveRight", services: awsServices.filter(s => s.category === "Migration") },
];

export function getServiceById(id: string): AwsService | undefined {
  return awsServices.find(s => s.id === id);
}
