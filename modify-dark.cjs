const fs = require("fs");
const path = require("path");
const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (/\.(tsx?|css|html)$/.test(e.name)) files.push(full);
  }
}
walk("src");
files.push("index.html");

const reps = [
  // backgrounds
  [/\bbg-slate-50\b(?![0-9])/g, "bg-slate-50 dark:bg-slate-900"],
  [/\bbg-slate-100\b(?![0-9])/g, "bg-slate-100 dark:bg-slate-800"],
  [/\bbg-slate-200\b(?![0-9])/g, "bg-slate-200 dark:bg-slate-700"],
  [/\bbg-white\b/g, "bg-white dark:bg-slate-800"],
  [/\bbg-amber-50\b/g, "bg-amber-50 dark:bg-amber-900/30"],
  [/\bbg-red-50\b/g, "bg-red-50 dark:bg-red-900/30"],
  [/\bbg-blue-50\b/g, "bg-blue-50 dark:bg-blue-900/30"],
  [/\bbg-green-50\b/g, "bg-green-50 dark:bg-green-900/30"],
  // text
  [/\btext-slate-900\b/g, "text-slate-900 dark:text-slate-100"],
  [/\btext-slate-800\b/g, "text-slate-800 dark:text-slate-200"],
  [/\btext-slate-700\b/g, "text-slate-700 dark:text-slate-200"],
  [/\btext-slate-600\b/g, "text-slate-600 dark:text-slate-300"],
  [/\btext-slate-500\b/g, "text-slate-500 dark:text-slate-400"],
  [/\btext-slate-400\b/g, "text-slate-400 dark:text-slate-500"],
  // borders
  [/\bborder-slate-200\b/g, "border-slate-200 dark:border-slate-700"],
  [/\bborder-slate-100\b/g, "border-slate-100 dark:border-slate-800"],
  // hovers
  [/\bhover:bg-slate-50\b/g, "hover:bg-slate-50 dark:hover:bg-slate-700"],
  [/\bhover:bg-white\b/g, "hover:bg-white dark:hover:bg-slate-700"],
  [/\bhover:bg-slate-100\b/g, "hover:bg-slate-100 dark:hover:bg-slate-700"],
];

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  const orig = content;
  for (const [re, to] of reps) content = content.replace(re, to);
  if (content !== orig) fs.writeFileSync(file, content);
}
console.log("done");
