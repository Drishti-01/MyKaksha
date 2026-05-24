# MyKaksha
Academic productivity &amp; adaptive study management platform

## Deploy on Render

The runnable app is in **`my-kaksha/`** (not the repo root).

1. Connect this GitHub repo to Render.
2. Set **Root Directory** to `my-kaksha` (or use the included `render.yaml` blueprint).
3. Add environment variables in the Render dashboard (see `my-kaksha/.env.example`).
4. Deploy.

If the build fails with `Could not read package.json`, Root Directory is wrong — it must be `my-kaksha`.
