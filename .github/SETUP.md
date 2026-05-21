# CI/CD Setup Guide — ChanTrader → cPanel Deployment

## What was built

| File | Purpose |
|---|---|
| `.github/workflows/deploy.yml` | Main pipeline: test → build → deploy (triggers on push to `main`) |
| `.github/workflows/tests.yml` | PR checks: PHPUnit + TypeScript + lint |
| `scripts/post-deploy.sh` | Server-side script (can also be run manually via SSH) |
| `.github/DEPLOY_PRIVATE_KEY.txt` | **Delete after adding to GitHub Secrets** |

---

## Server facts (discovered via Playwright)

| Item | Value |
|---|---|
| SSH host | `acapulco.hostns.io` |
| SSH port | `22` |
| SSH user | `itia` |
| Deploy path | `/home/itia/admin.chantrader.com` |
| PHP | 8.3.30 (CLI) |
| Composer | `php composer.phar` (phar inside repo root) |
| Node.js | **Not on server** — assets are built in GitHub Actions |
| Git remote | Already configured: `https://github.com/MuhammadShoaib00414/chan-trader-web.git` |
| .env | Already exists on server |
| SSH key | `github-actions` key imported & authorized in cPanel |

---

## One-time setup steps

### Step 1 — Add GitHub Secrets

Go to: **GitHub → `chan-trader-web` repo → Settings → Secrets and variables → Actions → New repository secret**

Add these five secrets:

| Secret name | Value |
|---|---|
| `SSH_HOST` | `acapulco.hostns.io` |
| `SSH_USERNAME` | `itia` |
| `SSH_PORT` | `22` |
| `DEPLOY_PATH` | `/home/itia/admin.chantrader.com` |
| `SSH_PRIVATE_KEY` | *(contents of `.github/DEPLOY_PRIVATE_KEY.txt`)* |

> **Security**: After adding `SSH_PRIVATE_KEY` to GitHub Secrets, delete `.github/DEPLOY_PRIVATE_KEY.txt` from the repo and never commit it.

### Step 2 — Create the GitHub Environment

Go to: **GitHub → Settings → Environments → New environment**

- Name: `production`
- (Optional) Add required reviewers for manual approval before each deploy

### Step 3 — Ensure the server can pull from GitHub

The deploy runs `git fetch origin main` on the server. If you get a credential error:

```bash
# SSH into the server, then:
cd /home/itia/admin.chantrader.com
git remote set-url origin https://<YOUR_GH_TOKEN>@github.com/MuhammadShoaib00414/chan-trader-web.git
```

Replace `<YOUR_GH_TOKEN>` with a GitHub Personal Access Token (repo scope).

### Step 4 — Push to `main` to trigger the pipeline

```bash
git checkout main
git merge feature/mobile-api-milestone2   # or your branch
git push origin main
```

The pipeline runs automatically:

```
push to main
  └─ test (PHPUnit)
  └─ build (npm run build:ssr → artifacts)
  └─ deploy
        ├─ git pull on server
        ├─ upload public/build/ via SCP
        ├─ upload bootstrap/ssr/ via SCP
        └─ composer install + migrate + artisan optimize
```

---

## Manual deploy (via SSH)

```bash
ssh itia@acapulco.hostns.io -p 22
cd /home/itia/admin.chantrader.com
bash scripts/post-deploy.sh
```

---

## How the pipeline handles key concerns

| Concern | Solution |
|---|---|
| No Node.js on server | Frontend built in GitHub Actions, uploaded via SCP |
| `public/build` gitignored | Built as artifact, uploaded separately |
| `bootstrap/ssr` gitignored | Same — built & uploaded |
| Composer not in PATH | Uses `php composer.phar` (phar in repo root) |
| Zero-downtime | Caches refreshed after all files land |
| Rollback | `git reset --hard <previous-sha>` on server + re-run post-deploy.sh |
| Queue workers | `php artisan queue:restart` called after every deploy |

---

## Troubleshooting

**SSH connection refused**
- Verify `SSH_HOST` = `acapulco.hostns.io` and `SSH_PORT` = `22`
- Check the key is authorized: cPanel → SSH Access → Manage SSH Keys → `github-actions` should show **authorized**

**Permission denied (publickey)**
- Re-check the `SSH_PRIVATE_KEY` secret includes the full key including `-----BEGIN` / `-----END` lines

**git pull fails with 403**
- Follow Step 3 above to embed a Personal Access Token in the remote URL

**Composer fails**
- Verify `composer.phar` exists: `ls /home/itia/admin.chantrader.com/composer.phar`
- If missing: `curl -sS https://getcomposer.org/installer | php -- --install-dir=/home/itia/admin.chantrader.com --filename=composer.phar`

**Build artifact not found**
- Check `npm run build:ssr` completes without error in the build job logs
