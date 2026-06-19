# Deploy From iPhone — No Computer Path

This project is implemented for a hosted PWA. The final user experience is:

1. Open a URL on iPhone
2. Use the app
3. Add it to the Home Screen

## Reality check

ChatGPT can generate the code package, but this chat environment cannot publish a permanent public Vercel/Netlify URL on your behalf.

To get the actual public link, one cloud deployment step is required. This can be done without a local computer if you use a cloud builder or ask someone/cloud agent to upload this package to a Git repository and connect it to Vercel.

## Recommended no-computer publishing path

Use this package with a cloud coding/deployment tool that supports importing a ZIP or GitHub repository from a mobile browser.

Recommended target deployment:

- Vercel project
- Framework preset: Next.js
- Build command: `next build`
- Install command: package-manager default
- Output: Next.js default
- Environment variables: none required for MVP

## What the deployer must do

The deployer should:

1. Create a GitHub repository from this package.
2. Import the repository into Vercel.
3. Deploy with the Next.js preset.
4. Send you the deployed URL.

After that, you only use the iPhone link.

## Why PWA first

A PWA avoids:

- Xcode
- App Store Connect
- TestFlight
- Expo local dev server
- Mac-only build steps
- iOS provisioning profiles

## iPhone use after deployment

1. Open the Vercel URL in Safari.
2. Tap Share.
3. Tap Add to Home Screen.
4. Use it like a private app.
