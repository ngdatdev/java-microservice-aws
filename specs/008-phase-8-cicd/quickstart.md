# Quickstart Guide: Phase 8 CI/CD & Verification

## 1. Prerequisites (Manual Setup)

Before the automated pipeline can function, you MUST configure the following Repository Secrets in GitHub (`Settings -> Secrets and variables -> Actions`):

- `AWS_ACCESS_KEY_ID`: IAM Access Key from Step 3 of the Master Playbook.
- `AWS_SECRET_ACCESS_KEY`: IAM Secret Access Key.

## 2. Triggering the CI Validation (Pull Request)

1. Create a new branch: `git checkout -b feature/test-ci`.
2. Make a small change (e.g., adding a comment in `member-service`).
3. Commit and push: `git commit -m "Test CI" && git push origin feature/test-ci`.
4. Open a **Pull Request** to `main`.
5. **Verify**: The GitHub Action `Verify Code & Build Jars` should trigger and pass.

## 3. Triggering the CD Deployment (Merge)

1. **Merge** the PR into `main`.
2. **Action**: The workflow will secondary jobs: `Docker Push to Amazon ECR` and `Deploy AWS Infrastructure (CDK)`.
3. **Verify**: Check the GitHub Actions tab for successful completion of all stages.

## 4. Operational Checkpoints

Once the deployment completes, consult the new guide at:
- `docs/AWS-SETUP-CHECKLIST.md`

Follow the SES and Cognito verification steps there to ensure the "Mây" (Cloud) is legally active for demoing!
