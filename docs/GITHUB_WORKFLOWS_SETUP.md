# 🔧 GitHub Workflows Setup Guide

## Overview

Due to GitHub security restrictions, workflow files cannot be automatically created by apps without special permissions. This guide provides the workflow configurations that need to be manually added to enable full CI/CD automation.

## 📋 Manual Setup Instructions

### Step 1: Create Workflow Directory

```bash
mkdir -p .github/workflows
```

### Step 2: Add CI/CD Workflow

Create `.github/workflows/ci-cd.yml` with the content from `docs/github-workflows/ci-cd.yml`

### Step 3: Add Security Workflow  

Create `.github/workflows/security.yml` with the content from `docs/github-workflows/security.yml`

### Step 4: Configure Repository Settings

1. **Enable GitHub Actions** (if not already enabled)
   - Go to repository Settings → Actions → General
   - Enable "Allow all actions and reusable workflows"

2. **Configure Branch Protection** (recommended)
   - Go to Settings → Branches
   - Add rule for `main` branch:
     - ✅ Require status checks to pass before merging
     - ✅ Require up-to-date branches before merging
     - ✅ Include administrators

3. **Setup Environments** (for deployment)
   - Go to Settings → Environments
   - Create `staging` environment
   - Create `production` environment with required reviewers

4. **Configure Secrets** (if needed)
   - Go to Settings → Secrets and variables → Actions
   - Add any required deployment secrets

## 🚀 Workflow Features

### CI/CD Pipeline (`ci-cd.yml`)
- **Quality Gates**: TypeScript, ESLint, tests, security audit
- **Performance Tests**: Benchmark validation with 30-minute timeout
- **Security Scanning**: Trivy vulnerability scanner
- **Container Build**: Docker image creation and registry push
- **Automated Deployment**: Staging and production with approval gates
- **Artifact Management**: Build artifacts with 30-day retention

### Security Workflow (`security.yml`)
- **Dependency Scanning**: npm audit with SBOM generation
- **Code Analysis**: GitHub CodeQL for security vulnerabilities
- **Secret Detection**: TruffleHog for credential leaks
- **Container Security**: Trivy image scanning
- **Weekly Scheduling**: Automated security checks every Monday

## 🔒 Security Considerations

### Required Permissions
- **Actions**: Read/Write (for workflow execution)
- **Security Events**: Write (for SARIF upload)
- **Packages**: Write (for container registry)
- **Contents**: Read (for code checkout)

### Security Features
- SARIF upload for vulnerability tracking
- Artifact signing and verification
- Multi-stage approval process for production
- Automated cleanup of old artifacts

## 📊 Expected Outcomes

Once workflows are active, you'll get:

1. **Automated Testing** on every PR and push
2. **Security Scanning** results in Security tab
3. **Performance Benchmarks** as workflow artifacts
4. **Container Images** pushed to GitHub Container Registry
5. **Deployment Automation** with proper approvals

## 🆘 Troubleshooting

### Common Issues

**"Workflow file is invalid"**
- Check YAML syntax with online validator
- Ensure proper indentation (spaces, not tabs)

**"Permission denied"**
- Verify Actions are enabled in repository settings
- Check branch protection rules don't block automated commits

**"Secrets not found"**
- Add required secrets in repository settings
- Use consistent naming between workflow and secrets

### Validation Commands

```bash
# Validate workflow syntax
npx @actions/cli workflow validate .github/workflows/ci-cd.yml

# Test workflow locally (if using act)
act -j quality-gates
```

## 🎯 Success Metrics

After setup, monitor these indicators:

- ✅ All workflow runs completing successfully
- ✅ Security alerts being reported and tracked
- ✅ Performance benchmarks within expected ranges
- ✅ Automated deployments working smoothly
- ✅ Artifact cleanup running weekly

## 📞 Support

If you encounter issues:

1. Check the [GitHub Actions documentation](https://docs.github.com/en/actions)
2. Review workflow run logs for specific error messages
3. Validate YAML syntax and permissions
4. Test with a simple workflow first if needed

---

**Note**: These workflows provide enterprise-grade CI/CD automation with comprehensive security scanning and performance validation. The setup enables continuous delivery while maintaining high quality and security standards.