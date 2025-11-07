#!/bin/bash
# Quick script to generate SSH keys for GitHub Actions

set -e

echo "================================================"
echo "   GitHub Actions SSH Key Generator"
echo "================================================"
echo ""

KEY_PATH="$HOME/.ssh/github-actions"

if [ -f "$KEY_PATH" ]; then
    echo "SSH key already exists at $KEY_PATH"
    read -p "Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

echo "Generating SSH key pair..."
ssh-keygen -t ed25519 -f "$KEY_PATH" -N "" -C "github-actions@log-monitoring"

echo ""
echo "================================================"
echo "   SSH Keys Generated Successfully!"
echo "================================================"
echo ""

echo "📋 Private Key (Add to GitHub Secret: VPS_SSH_PRIVATE_KEY)"
echo "-----------------------------------------------------------"
cat "$KEY_PATH"
echo ""
echo ""

echo "📋 Public Key (Add to VPS ~/.ssh/authorized_keys)"
echo "-----------------------------------------------------------"
cat "$KEY_PATH.pub"
echo ""
echo ""

echo "GitHub Secrets to add:"
echo "  1. VPS_SSH_PRIVATE_KEY"
echo "     Value: (copy the private key above)"
echo ""
echo "  2. VPS_HOST"
echo "     Value: your-vps-ip-or-domain"
echo ""
echo "  3. VPS_USER"
echo "     Value: your-vps-username (e.g., deploy or ubuntu)"
echo ""
echo "  4. VPS_BASTION_HOST (optional - for proxy jump)"
echo "     Value: bastion-host-ip-or-domain"
echo ""
echo "  5. VPS_BASTION_USER (optional - for proxy jump)"
echo "     Value: bastion-username"
echo ""

echo "On your VPS, run:"
echo "  mkdir -p ~/.ssh"
echo "  nano ~/.ssh/authorized_keys"
echo "  # Paste the public key above"
echo "  chmod 600 ~/.ssh/authorized_keys"
echo ""

echo "Optional: Setup SSH config for proxy jump on your local machine:"
echo "  nano ~/.ssh/config"
echo ""
echo "Add this configuration:"
echo "-----------------------------------------------------------"
echo "Host log-monitoring"
echo "    HostName your-vps-ip"
echo "    User your-vps-user"
echo "    ProxyJump bastion-user@bastion-host"
echo "    IdentityFile ~/.ssh/github-actions"
echo "-----------------------------------------------------------"
echo ""

echo "✅ Done! Keys are saved at:"
echo "   Private: $KEY_PATH"
echo "   Public:  $KEY_PATH.pub"
