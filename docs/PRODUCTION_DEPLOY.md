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

````
