````markdown
# Production Deploy Checklist

This file documents the steps required to prepare and trigger a production deploy for this project.

Required secrets (GitHub repository → Settings → Secrets & variables → Actions):
- `FIREBASE_PROJECT`: the Firebase project id (example: `mjrp-playlist-generator`).
- `FIREBASE_TOKEN`: token for `firebase-tools` deploy, or alternatively configure a service account and use action-based auth.
- `FIREBASE_PROJECT`: the Firebase project id (example: `mjrp-playlist-generator`).
- `FIREBASE_SERVICE_ACCOUNT`: preferred - GitHub Actions secret containing the service-account JSON (raw JSON or base64-encoded). When present, CI uses `google-github-actions/auth` and `firebase-tools` without a long-lived token.
- `FIREBASE_TOKEN`: legacy token for `firebase-tools` deploy (still supported), but service-account via `FIREBASE_SERVICE_ACCOUNT` or GitHub OIDC is recommended.

CI workflow:
- The repository includes `.github/workflows/ci-firebase.yml` which runs tests and builds on PRs and pushes to `main` / `v0.2` / tags. Preview channels are deployed for PRs; production deploys are triggered on pushes to `main`, `v0.2`, or tags matching `v*`.

Manual checklist before promoting to production
1. Run unit tests locally:

```bash
cd server
npm ci
npm test
```

2. Verify the CI run for your branch/PR passed (build + tests). If not, fix failures before merge.

3. Confirm repository secrets exist and are correct. In particular ensure `FIREBASE_PROJECT` matches the Firebase project id.

4. Merge the branch into `main` (or create/push a `vX.Y` tag). The `deploy-production` job will run automatically.

5. Monitor the GitHub Actions run and wait for the `deploy-production` job to finish. The action will run:

```bash
npx firebase-tools deploy --only hosting --project "$FIREBASE_PROJECT"
```

6. Verify the published site: `https://<FIREBASE_PROJECT>.web.app` (or the custom domain configured in Firebase Hosting).

Optional recommendations
- Protect the `main` branch and require the CI workflow to pass before merging.
- Consider switching to a service-account JSON and `google-github-actions/auth` for deployments to avoid long-lived tokens.
 - Prefer `FIREBASE_SERVICE_ACCOUNT` (GitHub Actions secret) or GitHub OIDC to avoid long-lived tokens. The CI workflow already supports `FIREBASE_SERVICE_ACCOUNT` and will authenticate automatically.

Local testing tips (useful when you have the service-account JSON locally):

1. Save the downloaded JSON key locally, for example `~/keys/mjrp-service-account.json`.
2. Export ADC so tools pick it up:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=~/keys/mjrp-service-account.json
gcloud auth activate-service-account --key-file="$GOOGLE_APPLICATION_CREDENTIALS"
```

3. Run the local deploy script (it detects `GOOGLE_APPLICATION_CREDENTIALS`):

```bash
./scripts/deploy-prod.sh
```

4. Or, if you prefer not to write the file locally, set `FIREBASE_SERVICE_ACCOUNT` (raw JSON or base64) in your shell and the script will create a temp key file for you:

```bash
export FIREBASE_SERVICE_ACCOUNT='{"type": "service_account", ... }'
./scripts/deploy-prod.sh
```

Note: avoid leaving service-account keys on disk or in shell history; use CI secrets for production workflows.
- Add a root lockfile (e.g., `package-lock.json`) if applicable to speed up caching during workflow runs.

Automatic local key detection
----------------------------

To make local deploys as simple as running `./scripts/deploy-prod.sh` from the repository root, the deploy script will automatically look for a locally-stored key at `../keys/mjrp-service-account.json` (relative to the repo root). If that file exists and you have not set `FIREBASE_SERVICE_ACCOUNT` or `GOOGLE_APPLICATION_CREDENTIALS`, the script will load the JSON from that file and use it for the deploy.

This allows you to simply run:

```bash
cd ~/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0
./scripts/deploy-prod.sh 2>&1 | tee ~/deploy-prod.log
```

Notes and best practices:
- The script still prefers `FIREBASE_SERVICE_ACCOUNT` (CI secret) and `GOOGLE_APPLICATION_CREDENTIALS` if they're already set.
- Storing the key in `../keys/` is a convenience for local runs only; do NOT commit this file. Keep it readable only to your user (`chmod 600`).
- For CI, add the service account JSON (raw or base64) to the repository's Actions secrets as `FIREBASE_SERVICE_ACCOUNT` and let the workflow run the deploy automatically.

Cleanup
-------

After a successful deploy the script creates a temporary key file while running; it is automatically removed when the script exits. If you need to remove your local copy of the key after deploying, do:

```bash
rm -f ~/VibeCoding/MyProjects/keys/mjrp-service-account.json
```

If you want an explicit wrapper script (for example `scripts/deploy.sh`) that sets the common envs and runs `deploy-prod.sh`, ask and I will add it.

````
