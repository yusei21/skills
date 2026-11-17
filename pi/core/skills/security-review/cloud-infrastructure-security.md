| name | description |
|------|-------------|
| cloud-infrastructure-security | Use this skill when deploying to cloud platforms, configuring infrastructure, managing IAM policies, setting up logging/monitoring, or implementing CI/CD pipelines. Provides cloud security checklist aligned with best practices. |

# Cloud & Infrastructure Security Skill

This skill ensures cloud infrastructure, CI/CD pipelines, and deployment configurations follow security best practices and comply with industry standards.

## When to Activate

- Deploying applications to cloud platforms (AWS, Vercel, Railway, Cloudflare)
- Configuring IAM roles and permissions
- Setting up CI/CD pipelines
- Implementing infrastructure as code (Terraform, CloudFormation)
- Configuring logging and monitoring
- Managing secrets in cloud environments
- Setting up CDN and edge security
- Implementing disaster recovery and backup strategies

## Cloud Security Checklist

### 1. IAM & Access Control

#### Principle of Least Privilege

```yaml
# PASS: CORRECT: Minimal permissions
iam_role:
  permissions:
    - s3:GetObject  # Only read access
    - s3:ListBucket
  resources:
    - arn:aws:s3:::my-bucket/*  # Specific bucket only

# FAIL: WRONG: Overly broad permissions
iam_role:
  permissions:
    - s3:*  # All S3 actions
  resources:
    - "*"  # All resources
```

#### Multi-Factor Authentication (MFA)

```bash
# ALWAYS enable MFA for root/admin accounts
aws iam enable-mfa-device \
  --user-name admin \
  --serial-number arn:aws:iam::123456789:mfa/admin \
  --authentication-code1 123456 \
  --authentication-code2 789012
```

#### Verification Steps

- [ ] No root account usage in production
- [ ] MFA enabled for all privileged accounts
- [ ] Service accounts use roles, not long-lived credentials
- [ ] IAM policies follow least privilege
- [ ] Regular access reviews conducted
- [ ] Unused credentials rotated or removed

### 2. Secrets Management

#### Cloud Secrets Managers

```typescript
// PASS: CORRECT: Use cloud secrets manager
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });
const { SecretString } = await client.send(
  new GetSecretValueCommand({ SecretId: 'prod/api-key' })
);
if (!SecretString) throw new Error('Secret prod/api-key has no string value');
const apiKey = JSON.parse(SecretString).key;

// FAIL: WRONG: Hardcoded or in environment variables only
const apiKey = process.env.API_KEY; // Not rotated, not audited
```

#### Secrets Rotation

```bash
# Set up automatic rotation for database credentials
aws secretsmanager rotate-secret \
  --secret-id prod/db-password \
  --rotation-lambda-arn arn:aws:lambda:region:account:function:rotate \
  --rotation-rules AutomaticallyAfterDays=30
```

#### Verification Steps

- [ ] All secrets stored in cloud secrets manager (AWS Secrets Manager, Vercel Secrets)
- [ ] Automatic rotation enabled for database credentials
- [ ] API keys rotated at least quarterly
- [ ] No secrets in code, logs, or error messages
- [ ] Audit logging enabled for secret access

### 3. Network Security

#### VPC and Firewall Configuration

```terraform
# PASS: CORRECT: Restricted security group, one resource per rule
# (AWS provider 5+; inline ingress/egress blocks cannot be tagged or
# changed one rule at a time, and must not be mixed with rule resources)
resource "aws_security_group" "app" {
  name   = "app-sg"
  vpc_id = aws_vpc.main.id
}

resource "aws_vpc_security_group_ingress_rule" "app_https" {
  security_group_id = aws_security_group.app.id
  cidr_ipv4         = "10.0.0.0/16" # Internal VPC only
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}

resource "aws_vpc_security_group_egress_rule" "app_https_out" {
  security_group_id = aws_security_group.app.id
  cidr_ipv4         = "0.0.0.0/0" # Only HTTPS outbound
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}

# FAIL: WRONG: Open to the internet
resource "aws_vpc_security_group_ingress_rule" "bad" {
  security_group_id = aws_security_group.app.id
  cidr_ipv4         = "0.0.0.0/0" # All IPs
  ip_protocol       = "-1"        # All protocols and ports!
}
```

#### Verification Steps

- [ ] Database not publicly accessible
- [ ] SSH/RDP ports restricted to VPN/bastion only
- [ ] Security groups follow least privilege
- [ ] Network ACLs configured
- [ ] VPC flow logs enabled

### 4. Logging & Monitoring

#### CloudWatch/Logging Configuration

```typescript
// PASS: CORRECT: Comprehensive logging
import { CloudWatchLogsClient, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';

const cloudwatch = new CloudWatchLogsClient({ region: 'us-east-1' });

// The log group and stream must already exist (create them in Terraform).
const logSecurityEvent = async (event: SecurityEvent) => {
  await cloudwatch.send(new PutLogEventsCommand({
    logGroupName: '/aws/security/events',
    logStreamName: 'authentication',
    logEvents: [{
      timestamp: Date.now(),
      message: JSON.stringify({
        type: event.type,
        userId: event.userId,
        ip: event.ip,
        result: event.result,
        // Never log sensitive data
      })
    }]
  }));
};
```

#### Verification Steps

- [ ] CloudWatch/logging enabled for all services
- [ ] Failed authentication attempts logged
- [ ] Admin actions audited
- [ ] Log retention configured (90+ days for compliance)
- [ ] Alerts configured for suspicious activity
- [ ] Logs centralized and tamper-proof

### 5. CI/CD Pipeline Security

#### Secure Pipeline Configuration

```yaml
# PASS: CORRECT: Secure GitHub Actions workflow
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read  # Minimal permissions
      id-token: write # Required to request the OIDC token below

    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0 # The secret scanner needs history to diff against

      # Scan for secrets. Pin third-party actions to a full commit SHA, never
      # a branch such as @main: whoever controls the branch controls your job.
      - name: Secret scanning
        uses: trufflesecurity/trufflehog@3bd2b5887eb0efb8fa18bfd1d296032924e4ffdc # v3.99.9
        with:
          extra_args: --results=verified

      # Dependency audit
      - name: Audit dependencies
        run: npm audit --audit-level=high

      # Use OIDC, not long-lived tokens
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@e1253824e5c10ff9df46874f81ed3ec929e19cfd # v6.3.0
        with:
          role-to-assume: arn:aws:iam::123456789:role/GitHubActionsRole
          aws-region: us-east-1
```

#### Supply Chain Security

```bash
# Commit the lock file and install from it in CI: npm ci fails instead of
# silently resolving new versions when package.json and the lock disagree
npm ci --ignore-scripts      # skip install scripts of dependencies
npm audit --audit-level=high # fail on known vulnerabilities
npm audit signatures         # verify registry signatures and provenance
```

#### Verification Steps

- [ ] OIDC used instead of long-lived credentials
- [ ] Secrets scanning in pipeline
- [ ] Dependency vulnerability scanning
- [ ] Container image scanning (if applicable)
- [ ] Branch protection rules enforced
- [ ] Code review required before merge
- [ ] Signed commits enforced

### 6. Cloudflare & CDN Security

#### Cloudflare Security Configuration

```typescript
// PASS: CORRECT: Cloudflare Workers with security headers
export default {
  async fetch(request: Request): Promise<Response> {
    const response = await fetch(request);

    // Add security headers
    const headers = new Headers(response.headers);
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'geolocation=(), microphone=()');

    return new Response(response.body, {
      status: response.status,
      headers
    });
  }
};
```

#### WAF Rules

```bash
# Enable Cloudflare WAF managed rules
# - OWASP Core Ruleset
# - Cloudflare Managed Ruleset
# - Rate limiting rules
# - Bot protection
```

#### Verification Steps

- [ ] WAF enabled with OWASP rules
- [ ] Rate limiting configured
- [ ] Bot protection active
- [ ] DDoS protection enabled
- [ ] Security headers configured
- [ ] SSL/TLS strict mode enabled

### 7. Backup & Disaster Recovery

#### Automated Backups

```terraform
# PASS: CORRECT: Automated RDS backups
resource "aws_db_instance" "main" {
  allocated_storage     = 20
  engine               = "postgres"

  backup_retention_period = 30  # 30 days retention
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql"]

  deletion_protection = true  # Prevent accidental deletion
}
```

#### Verification Steps

- [ ] Automated daily backups configured
- [ ] Backup retention meets compliance requirements
- [ ] Point-in-time recovery enabled
- [ ] Backup testing performed quarterly
- [ ] Disaster recovery plan documented
- [ ] RPO and RTO defined and tested

## Pre-Deployment Cloud Security Checklist

Before ANY production cloud deployment:

- [ ] **IAM**: Root account not used, MFA enabled, least privilege policies
- [ ] **Secrets**: All secrets in cloud secrets manager with rotation
- [ ] **Network**: Security groups restricted, no public databases
- [ ] **Logging**: CloudWatch/logging enabled with retention
- [ ] **Monitoring**: Alerts configured for anomalies
- [ ] **CI/CD**: OIDC auth, secrets scanning, dependency audits
- [ ] **CDN/WAF**: Cloudflare WAF enabled with OWASP rules
- [ ] **Encryption**: Data encrypted at rest and in transit
- [ ] **Backups**: Automated backups with tested recovery
- [ ] **Compliance**: GDPR/HIPAA requirements met (if applicable)
- [ ] **Documentation**: Infrastructure documented, runbooks created
- [ ] **Incident Response**: Security incident plan in place

## Common Cloud Security Misconfigurations

### S3 Bucket Exposure

```bash
# FAIL: WRONG: Public bucket (turning off Block Public Access, then a public ACL)
aws s3api delete-public-access-block --bucket my-bucket
aws s3api put-bucket-ownership-controls --bucket my-bucket \
  --ownership-controls 'Rules=[{ObjectOwnership=ObjectWriter}]'
aws s3api put-bucket-acl --bucket my-bucket --acl public-read

# PASS: CORRECT: Block Public Access on, ACLs disabled (the default for new
# buckets since April 2023), access granted only through the bucket policy
aws s3api put-public-access-block --bucket my-bucket \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-ownership-controls --bucket my-bucket \
  --ownership-controls 'Rules=[{ObjectOwnership=BucketOwnerEnforced}]'
aws s3api put-bucket-policy --bucket my-bucket --policy file://policy.json
```

### RDS Public Access

```terraform
# FAIL: WRONG
resource "aws_db_instance" "bad" {
  publicly_accessible = true  # NEVER do this!
}

# PASS: CORRECT
resource "aws_db_instance" "good" {
  publicly_accessible = false
  vpc_security_group_ids = [aws_security_group.db.id]
}
```

## Resources

- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- [CIS AWS Foundations Benchmark](https://www.cisecurity.org/benchmark/amazon_web_services)
- [Cloudflare Security Documentation](https://developers.cloudflare.com/security/)
- [OWASP Cloud Security](https://owasp.org/www-project-cloud-security/)
- [Terraform Recommended Practices](https://developer.hashicorp.com/terraform/cloud-docs/recommended-practices)

**Remember**: Cloud misconfigurations are the leading cause of data breaches. A single exposed S3 bucket or overly permissive IAM policy can compromise your entire infrastructure. Always follow the principle of least privilege and defense in depth.
