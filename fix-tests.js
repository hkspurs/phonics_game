const fs = require('fs');
const glob = require('glob');

const files = glob.sync('tests/**/*.spec.js');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace page.goto('/') with page.goto('/#/phonics') but careful not to break mathDomain.spec.js if it clicks Math
  // Actually, wait, if mathDomain.spec.js clicks "Math Kingdom", it NEEDS page.goto('/').
  if (file.includes('mathDomain') || file.includes('mathParentReport')) {
    // leave them alone or fix only if needed
    // Actually mathParentReport.spec.js passed! So it's fine.
    // mathDomain.spec.js passed! So it's fine.
    return;
  }

  content = content.replace(/await page\.goto\('\/'\);/g, "await page.goto('/#/phonics');");
  content = content.replace(/await page\.goto\('http:\/\/localhost:5173\/phonics_game\/'\);/g, "await page.goto('/#/phonics');");
  content = content.replace(/await page\.goto\('#\/'\);/g, "await page.goto('/#/phonics');");

  // Also some might use /challenge instead of /#/challenge
  // But wait, page.goto('/challenge') on HashRouter goes to http://localhost:5173/challenge which is NOT hash routed. Playwright might fail.
  // Playwright baseUrl is http://localhost:5173
  // So /challenge is wrong. It should be /#/challenge

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
