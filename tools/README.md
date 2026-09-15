# Screenshot tools

Captures app screens from the local dev app (http://localhost:3000) with student, parent and teacher names blurred, then converts them to WebP for the site.

1. Log in to the app in a browser, copy `localStorage.kardan_token` into `tools/.token` and `localStorage.kardan_user` into `tools/.user` (both gitignored).
2. `cd tools && npm install && npx playwright install chromium`
3. `BLUR_TEACHERS=1 node shoot.js` for the list pages, `node planning.js 6` for the monthly planning (month + daily view for day 6 of next month), then `node convert.js`.
4. Delete the PNGs, keep the WebP files, commit and push. GitHub Pages publishes `main` to https://kardanokul.com within a minute.
