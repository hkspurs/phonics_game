const fs = require('fs');
const glob = require('glob');

const files = glob.sync('tests/**/*.spec.js');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  if (file.includes('mathDomain') || file.includes('mathParentReport')) {
    return;
  }

  content = content.replace(/await page\.goto\('\/'\);/g, "await page.goto('/#/phonics');");
  content = content.replace(/await page\.goto\('http:\/\/localhost:5173\/phonics_game\/'\);/g, "await page.goto('/#/phonics');");
  content = content.replace(/await page\.goto\('#\/'\);/g, "await page.goto('/#/phonics');");

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
