# Research: Phase 6 Deployment Architecture

## Unknowns & Decisions

### Decision 1: Stack Reference Passing Methods
**Decision**: Use native CDK Construct references (`stackA.vpc`, `stackA.cluster`) rather than raw `CfnOutput` and `Fn::ImportValue` strings.
**Rationale**: Native object passing allows CDK to mathematically calculate dependencies and auto-wire IAM permissions across stacks seamlessly, preventing manual ARN typos and resolving cross-stack export locking issues safely.
**Alternatives**: Using AWS Systems Manager (SSM) Parameter Store to decouple stacks entirely. Rejected due to the unnecessary architectural overhead for a Demo-focused system.

### Decision 2: Environment Provisioning (CDK_ENV vs Native Context)
**Decision**: Use `app.node.tryGetContext('env')` native to CDK context mechanisms rather than strictly relying on raw OS environment variables like `$CDK_ENV`.
**Rationale**: `cdk.json` can establish hard defaults (`"env": "dev"`), allowing `cdk deploy --context env=staging` to work identically and deterministically on local laptops and CI pipelines.
**Alternatives**: Pure Bash `.env` loading. Rejected as it breaches the native, deterministic CDK context patterns.

### Decision 3: Script Invocation Paths
**Decision**: Use `npm run deploy:dev` which acts as a wrapper around `./scripts/deploy-dev.sh` which in turn serves as the final parameterized wrapper for `cdk deploy`.
**Rationale**: Meets user requirements of having isolated, executable shell scripts (as documented in the prompt spec) while gracefully preserving standard `package.json` entry points expected by Node.js developers.
