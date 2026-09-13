# header-check

A small tool that scans any website's HTTP response and reports which
security headers it is (and isn't) sending.

## Run locally

```
npm install
npm run dev
```

Vite will start a dev server (usually http://localhost:5173).
The `/api/check` function only runs properly on Vercel's servers or via
`vercel dev` — plain `npm run dev` will not execute api/check.js.

## Deploy to Vercel (free)

1. Push this folder to a new GitHub repo:
   ```
   git init
   git add .
   git commit -m "initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. Go to vercel.com, sign in with GitHub, click "Add New Project".
3. Select this repo. Vercel auto-detects Vite — just click Deploy.
4. You'll get a free `https://<project>.vercel.app` URL with HTTPS
   already on, and the security headers from vercel.json applied
   automatically.

## Test it locally against the real function

Install the Vercel CLI to run the api/ function locally too:
```
npm install -g vercel
vercel dev
```

## Deploy to Netlify instead (no phone verification usually required)

1. Push this folder to GitHub (same git commands as above), OR skip GitHub
   entirely and drag-and-drop the folder into Netlify's dashboard.
2. Go to https://app.netlify.com, sign up with email or GitHub.
3. Click "Add new site" > "Import an existing project" (if using GitHub),
   or "Deploy manually" and drag the whole project folder in.
4. Netlify reads netlify.toml automatically — build command and function
   folder are already configured. Click Deploy.
5. You'll get a free https://<random-name>.netlify.app URL with HTTPS.

Note: for drag-and-drop deploy, run `npm run build` locally first so the
`dist` folder exists — Netlify's manual deploy just uploads static files
plus functions, it doesn't run the build step for you in that mode.
