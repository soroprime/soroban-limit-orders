# Security Policy

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly:

### How to Report

Email us at **security@yourdomain.com** with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### What to Expect

- Acknowledgment within 48 hours
- Regular updates on progress
- Fix timeline estimate
- Public disclosure coordination

### Disclosure Policy

- **90-day disclosure window**: We request 90 days to address vulnerabilities before public disclosure
- **Coordinated disclosure**: We'll work with you on timing and messaging
- **Credit**: Public acknowledgment in CHANGELOG (unless you prefer anonymity)

## Scope

### In Scope

- Settlement contract (`contracts/limit_order/`)
- Keeper bot (`keeper/`)
- Order book service (`orderbook/`)
- TypeScript SDK (`sdk/`)
- Indexer (`indexer/`)

### Out of Scope

- Frontend cosmetic issues
- Third-party DEX contract vulnerabilities
- Infrastructure issues (DNS, CDN, etc.)
- Social engineering attacks
- Denial of service on public RPC endpoints

## Bug Bounty

While we don't have a formal bug bounty program, we offer:

- Public acknowledgment in CHANGELOG.md
- Contributor recognition in README
- Swag for significant findings (case by case)

## Security Best Practices

### For Users

- Never share your secret key
- Verify contract addresses before interacting
- Use hardware wallets for large amounts
- Monitor your orders regularly

### For Developers

- Always validate inputs on-chain and off-chain
- Use the canonical order hash for signatures
- Implement proper nonce management
- Test with the mock DEX before mainnet

## Audits

This protocol has not yet undergone a professional security audit. We recommend:

- Testnet testing only until audit completion
- Limited value deposits during early stages
- Community review of contract code

We plan to engage a professional audit firm before mainnet launch.