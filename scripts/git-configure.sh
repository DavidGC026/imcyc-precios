#!/usr/bin/env bash
# Configura Git + SSH dedicado para push a github.com/DavidGC026/imcyc-precios
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEY_DIR="/var/www/sources/git"
KEY_FILE="${KEY_DIR}/imcyc-precios-github"
SSH_HOST_ALIAS="github-imcyc-precios"

if [ ! -f "$KEY_FILE" ]; then
  echo "Generando clave SSH en ${KEY_FILE}…" >&2
  mkdir -p "$KEY_DIR"
  chmod 750 "$KEY_DIR"
  ssh-keygen -t ed25519 -C "deploy-imcyc-precios@grabador.imcyc.com" -f "$KEY_FILE" -N "" -q
  chmod 600 "$KEY_FILE"
  chmod 644 "${KEY_FILE}.pub"
fi

mkdir -p /root/.ssh
chmod 700 /root/.ssh
if ! grep -q "Host ${SSH_HOST_ALIAS}" /root/.ssh/config 2>/dev/null; then
  cat >> /root/.ssh/config <<EOF

# IMCYC precios — deploy key (solo este repo)
Host ${SSH_HOST_ALIAS}
  HostName github.com
  User git
  IdentityFile ${KEY_FILE}
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
EOF
  chmod 600 /root/.ssh/config
fi

cd "$REPO_ROOT"
git config --local user.name "IMCYC Precios Deploy"
git config --local user.email "sistemas@imcyc.com"
git config --local core.sshCommand "ssh -i ${KEY_FILE} -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
# URL estándar de GitHub; la clave dedicada va en core.sshCommand (no en ~/.ssh global).
git remote set-url origin "git@github.com:DavidGC026/imcyc-precios.git"

echo ""
echo "Git configurado en: ${REPO_ROOT}"
echo "Remote: $(git remote get-url origin)"
echo ""
echo "Añade esta clave pública en GitHub → repo imcyc-precios → Settings → Deploy keys → Add:"
echo "  (permiso: Allow write access)"
echo ""
cat "${KEY_FILE}.pub"
echo ""
echo "Luego ejecuta: cd ${REPO_ROOT} && git push -u origin main"
