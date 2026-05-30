#!/usr/bin/env bash
#
# bootstrap-worktree.sh — make a fresh git worktree runnable.
#
# Git worktrees only check out *tracked* files. Our secrets (.env.local) and
# dependencies (node_modules) are gitignored, so a new worktree starts with
# neither — `next dev` then can't find env vars or the `next` package. This
# script links the env file back to the MAIN checkout (single source of truth,
# never copied → secrets can't drift or be committed) and installs deps.
#
# Safe to run repeatedly. No-op in the main checkout. Run from inside the
# worktree:  bash scripts/bootstrap-worktree.sh
#
set -euo pipefail

THIS_WT="$(git rev-parse --show-toplevel)"
MAIN_WT="$(git worktree list --porcelain | awk '/^worktree /{print $2; exit}')"

if [ "$THIS_WT" = "$MAIN_WT" ]; then
  echo "✓ In the main checkout — nothing to link."
else
  echo "Main checkout: $MAIN_WT"
  echo "This worktree: $THIS_WT"

  # Symlink (never copy) any env file the main checkout has but we don't.
  # A symlink named .env.local is still matched by the .env* gitignore rule,
  # so secrets stay out of version control.
  linked=0
  for f in .env.local .env .env.development.local .env.production.local; do
    if [ -f "$MAIN_WT/$f" ] && [ ! -e "$THIS_WT/$f" ]; then
      ln -s "$MAIN_WT/$f" "$THIS_WT/$f"
      echo "  linked $f → $MAIN_WT/$f"
      linked=1
    fi
  done
  [ "$linked" -eq 0 ] && echo "  (env files already present — left as-is)"

  # Belt-and-suspenders: confirm git still ignores the env file we just linked.
  if [ -e "$THIS_WT/.env.local" ] && ! git check-ignore -q .env.local; then
    echo "✗ REFUSING TO CONTINUE: .env.local is NOT gitignored here." >&2
    echo "  Fix .gitignore before running the app — secrets could be committed." >&2
    exit 1
  fi
fi

# Install deps if missing (worktrees don't carry node_modules).
if [ ! -d "$THIS_WT/node_modules/next" ]; then
  echo "Installing dependencies…"
  npm install
else
  echo "✓ Dependencies already installed."
fi

echo "✓ Worktree ready — \`npm run dev\` should now work."
