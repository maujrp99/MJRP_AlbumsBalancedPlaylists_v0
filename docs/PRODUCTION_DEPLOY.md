````markdown
# Production Deploy Checklist

This file documents the steps required to prepare and trigger a production deploy for this project.

Required secrets (GitHub repository → Settings → Secrets & variables → Actions):
- `FIREBASE_PROJECT`: the Firebase project id (example: `mjrp-playlist-generator`).
- `FIREBASE_TOKEN`: token for `firebase-tools` deploy, or alternatively configure a service account and use action-based auth.

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
npx firebase-tools deploy --only hosting --project "$FIREBASE_PROJECT" --token "$FIREBASE_TOKEN"
```

6. Verify the published site: `https://<FIREBASE_PROJECT>.web.app` (or the custom domain configured in Firebase Hosting).

Optional recommendations
- Protect the `main` branch and require the CI workflow to pass before merging.
- Consider switching to a service-account JSON and `google-github-actions/auth` for deployments to avoid long-lived tokens.
- Add a root lockfile (e.g., `package-lock.json`) if applicable to speed up caching during workflow runs.

````
