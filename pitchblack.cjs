const fs = require("fs");
const path = require("path");
const files = [];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(/\.(tsx?|css|html)$/.test(e.name))files.push(f);}}
walk("src");files.push("index.html");
const reps=[
 [/\bdark:bg-slate-900\b/g,"dark:bg-black"],
 [/\bdark:bg-slate-800\b/g,"dark:bg-[#0a0a0a]"],
 [/\bdark:bg-slate-700\b/g,"dark:bg-[#111111]"],
];
for(const file of files){let c=fs.readFileSync(file,"utf8");const o=c;for(const [r,t]of reps)c=c.replace(r,t);if(c!==o)fs.writeFileSync(file,c);}
console.log("done");
