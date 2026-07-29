# 0006 - Allowed CORS origins are per-environment config, not repo content

- **Status:** accepted, current production arrangement as of July 2026
- **Applies to:** ICAT-TC.MainService and the other NestJS backends; operations
- **Note:** the deployment details below were established by inspecting the running environment in July 2026,
  not from repo configuration. Re-check them before relying on them.

## Context

The Angular frontends call the NestJS backends from a browser, so every frontend origin must appear in each
browser-facing backend's CORS allowlist. Origins differ per environment and change when a custom domain is
introduced, which is not something that should require a code change and a redeploy.

## Decision

Each backend builds its allowlist at runtime from the **`CORS_ORIGINS` environment variable**
(comma-separated, falling back to `ClientURl` / `CLIENT_URL`), read in `src/config/cors.config.ts` and passed
to `app.enableCors()`. Adding or removing an origin is a configuration change on the deployed service, with
no repo edit.

## Where production runs

Production is **GCP Cloud Run**, one service per backend, fronted by an external load balancer serving the
frontend on a custom domain with no Cloud Run domain mapping. The AWS ECR `buildspec.yml` files still present
in the repos appear stale and unused - do not follow them when reasoning about production.

The custom frontend origin has to be present on **every browser-facing backend** — the main, auth and audit
services all receive calls from it. The PMU backend serves a separate frontend and only needs a custom domain
added if that frontend gains one.

The concrete project, region, service names and origin values are deployment configuration and are
deliberately not recorded in this repository. Take them from the deployment environment or the internal
operations runbook.

To update, note that the command **replaces** the whole variable, so the value must include every origin that
should remain, and the `^@^` delimiter is needed so commas inside the value survive:

```
gcloud run services update <service> --region <region> \
  --update-env-vars "^@^CORS_ORIGINS=<full,comma,separated,list>"
```

## How this fails, and why it is confusing

The `cors` package omits the `Access-Control-Allow-Origin` header when the request's Origin is not in the
allowlist, but still sends `Access-Control-Allow-Credentials: true`. The server returns a 2xx and the request
looks healthy in logs and in Cloud Run metrics, while the browser blocks the response with "No
'Access-Control-Allow-Origin' header is present". A missing origin therefore presents as a client-side failure
with no server-side error to find.

If a frontend suddenly cannot reach a backend after a domain or environment change, check `CORS_ORIGINS`
before looking anywhere else.

## Consequence to watch

Any deployment pipeline that resets environment variables from a source of truth must carry the full origin
list, including custom domains, or this regresses silently on the next deploy.
