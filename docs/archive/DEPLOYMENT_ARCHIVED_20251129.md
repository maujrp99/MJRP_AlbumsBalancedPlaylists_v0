## Deployment Checklist (Cloud Run + Firebase Hosting)

This document describes the recommended, repeatable steps to deploy the proxy (`server/`) to Cloud Run and the static frontend (`public/`) to Firebase Hosting. It also lists post-deploy validation and security steps (Secret Manager rotation, CORS).

Prerequisites
- Google Cloud SDK (`gcloud`) installed & authenticated.
- Firebase CLI (`firebase-tools`) installed & authenticated.
- Project IAM: Cloud Run service account must have `roles/secretmanager.secretAccessor` for the secret used by the service.

High-level flow
1. Build & push container (Cloud Build or local Docker)
2. Deploy Cloud Run service (use the container or let Cloud Build + trigger deploy)
3. Ensure Cloud Run has environment variables and secret references
4. Deploy Firebase Hosting (rewrites point `/api/**` to Cloud Run)
5. Validate health and proxy endpoints
6. Rotate secrets if needed and re-deploy

Cloud Run: build & deploy

- Using Cloud Build (recommended - CI): commit to `main` and let the configured Cloud Build trigger run. Ensure `server/Dockerfile` exists at `server/Dockerfile`.

- Manual build+deploy (local):

```bash
# from repo root
gcloud builds submit --tag gcr.io/$GOOGLE_CLOUD_PROJECT/mjrp-proxy:latest server/
gcloud run deploy mjrp-proxy --image gcr.io/$GOOGLE_CLOUD_PROJECT/mjrp-proxy:latest \
  --region=southamerica-east1 --platform=managed --allow-unauthenticated \
  --set-env-vars AI_MODEL=models/gemini-2.5-flash,AI_ENDPOINT=https://generativelanguage.googleapis.com/v1
```

Secret Manager (AI API key)

- Create the secret (if not present):

```bash
gcloud secrets create AI_API_KEY --replication-policy=automatic
gcloud secrets versions add AI_API_KEY --data-file=- <<< "YOUR_NEW_API_KEY"
```

- Grant the Cloud Run service account access (Console or gcloud):

```bash
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
  --member="serviceAccount:$(gcloud run services describe mjrp-proxy --region=southamerica-east1 --format='value(spec.template.spec.serviceAccountName)')@${GOOGLE_CLOUD_PROJECT}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

- When deploying, reference the secret as an environment variable:

```bash
gcloud run deploy mjrp-proxy --image gcr.io/$GOOGLE_CLOUD_PROJECT/mjrp-proxy:latest \
  --update-secrets=AI_API_KEY=AI_API_KEY:latest --region=southamerica-east1 --platform=managed
```

CORS / Allowed origin

- The server should set `Access-Control-Allow-Origin` to the Firebase Hosting production origin (`https://mjrp-playlist-generator.web.app`) in production. Use an env var `ALLOWED_ORIGIN` and configure CORS middleware accordingly in `server/index.js`.

Firebase Hosting

- `firebase.json` should include a rewrite mapping `/api/**` to the Cloud Run service and region. Example:

```json
"rewrites": [
  {
    "source": "/api/**",
    "run": {
      "serviceId": "mjrp-proxy",
      "region": "southamerica-east1"
    }
  }
]
```

- Deploy hosting:

```bash
firebase deploy --only hosting --project mjrp-playlist-generator
```

Validation & smoke tests

- Health check:

```bash
curl -i https://<cloud-run-url>/_health
# expect HTTP/200 {"ok":true}
```

- Proxy test:

```bash
curl -i https://<cloud-run-url>/api/generate
curl -i https://mjrp-playlist-generator.web.app/api/generate
```

Secret rotation (important)

- If an API key is suspected leaked:
  - Add a new secret version in Secret Manager with the new key.
  - Re-deploy Cloud Run referencing the `latest` secret version or trigger a new revision so the new value is mounted into the runtime.
  - Revoke the old key at the provider and remove any old secret versions if required by policy.

Rollback

- Cloud Run maintains revisions; use `gcloud run services list-revisions` and `gcloud run services update-traffic` to route traffic to a previous revision.

CI / GitHub Actions

- Ensure your workflow references the project and service account credentials required to deploy. Use short-lived credentials or GitHub OIDC where possible. Keep secrets out of the repository.

CI checklist

- Use GitHub OIDC where possible to avoid long-lived service account keys. Configure a Workload Identity Pool and bind the minimal role to the GitHub Actions principal.
- Protect the deploy branch (`main`) with required reviews and CI checks so deploys are gated.
- Build and test before deploy:
  - Run `npm ci` and server unit tests in `server/test/`.
  - Run lint/format checks.
- Cloud Build trigger (or GitHub Action) should build `server/` with `server/Dockerfile` in context and push the image to the project registry.
- Grant the Cloud Run service account only the permissions it needs: `roles/run.invoker` is applied for invocations, `roles/secretmanager.secretAccessor` only if using Secret Manager.
- Store runtime configuration via environment variables in Cloud Run and reference secrets via `--update-secrets` or the Cloud Console.

Example high-level workflow (conceptual)

1. PR opened -> run tests + lint
2. Merge to `main` -> GitHub OIDC or Cloud Build trigger builds container image
3. Push image and deploy Cloud Run (new revision) with `AI_API_KEY` referenced from Secret Manager
4. Deploy Firebase Hosting release (optional step in same workflow)

Include checks for: image build success, unit tests passing, and successful deploy outputs/logs.

Operational notes
- Do not commit API keys or `.env` files. Keep `.env` in `.gitignore`.
- Monitor Cloud Run logs (Stackdriver/Cloud Logging) for errors and failed requests.
- Verify CORS headers via browser DevTools when testing the hosted frontend.

If you want, I can: (1) add a short `server/index.js` patch to use `ALLOWED_ORIGIN` for CORS; (2) create a CI checklist in this file; or (3) commit and push these docs for you. Tell me which to do next.
