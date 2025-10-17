// scripts/patch-extract-data.js
// Node >= 14
import fs from "fs";
import path from "path";
import { globSync } from "glob";

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const ROOT = process.cwd();
const dry = !APPLY;
const files = globSync("src/**/*.tsx", { nodir: true });

const importExtract = `import { extractData, getIdFromParams } from '@/lib/utils'`;

function ensureImport(content) {
  if (content.includes("from '@/lib/utils'")) return content;
  // try to find first import block; if none, add at top
  const importIndex = content.search(/import\s.+from\s.+['"].+['"];?\n/);
  // simpler: if file starts with 'use client' keep it at top after that
  if (
    content.startsWith("'use client'") ||
    content.startsWith('"use client"')
  ) {
    const lines = content.split("\n");
    const first = lines.shift();
    // add import after first line but before other imports
    let insertAt = 0;
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].startsWith("import")) {
        insertAt = i;
        break;
      }
    }
    lines.splice(insertAt, 0, importExtract);
    return [first, ...lines].join("\n");
  } else {
    return importExtract + "\n" + content;
  }
}

function replacePatterns(content) {
  let out = content;

  // 1) Replace `x?.data ?? x` with `extractData(x)` -- handle variable name pattern
  // regex: capture (\b[a-zA-Z0-9_$]+\b)\s*\?\.\s*data\s*\?\?\s*\1
  out = out.replace(
    /([a-zA-Z0-9_$]+)\s*\?\.\s*data\s*\?\?\s*\1/g,
    "extractData($1)"
  );

  // 2) Replace direct `body?.data ?? body` or `res?.data ?? res` when equal variable names already handled,
  // also replace `const data = res?.data ?? res` -> `const data = extractData(res)`
  out = out.replace(
    /const\s+([a-zA-Z0-9_$]+)\s*=\s*([a-zA-Z0-9_$]+)\s*\?\.\s*data\s*\?\?\s*\2/g,
    (m, varName, subject) => `const ${varName} = extractData(${subject})`
  );

  // 3) Replace occurrences like `body?.data ?? body` (where subject isn't repeated) conservatively:
  out = out.replace(
    /\b([a-zA-Z0-9_$]+)\s*\?\.\s*data\s*\?\?\s*([a-zA-Z0-9_$]+)/g,
    (m, left, right) => {
      if (left === right) return `extractData(${left})`;
      return m; // avoid touchy replacements where LHS != RHS
    }
  );

  // 4) Make toast.show usage safe: show={toast.show} -> show={!!toast?.show}
  out = out.replace(
    /\b<Toast\s+([^>]*?)\bshow=\{([^\}]+?)\}([^>]*?)>/g,
    (m, before, expr, after) => {
      if (expr.includes("!!") || expr.includes("Boolean(")) return m;
      // replace show prop only
      return `<Toast ${before}show={!!(${expr})}${after}>`;
    }
  );

  // 5) Replace resolved?.id or params?.id patterns used after Promise.resolve(params)
  out = out.replace(
    /const\s+resolved\s*=\s*await\s+Promise\.resolve\(\s*([a-zA-Z0-9_$]+)\s*\)\s*;\s*const\s+id\s*=\s*([a-zA-Z0-9_$]+)\s*\?\.\s*id/g,
    (m, paramsVar, idExpr) => {
      // keep the existing resolved line but change id calc to use getIdFromParams
      return `const resolved = await Promise.resolve(${paramsVar});\n                    const id = getIdFromParams(resolved)`;
    }
  );

  // 6) Replace direct `const id = params?.id` with `const id = getIdFromParams(params)` in files that call useParams
  out = out.replace(
    /const\s+id\s*=\s*(?:Array\.isArray\([^)]+\)\s*\?\s*[^:]+:\s*([^)]+)|([a-zA-Z0-9_$]+))\s*;\s*const\s+id\s*=\s*([a-zA-Z0-9_$]+)\s*\?\.\s*id/g,
    (m) => m
  );

  // 7) Replace common pattern: `const data = body?.data ?? body` (simple)
  out = out.replace(
    /const\s+data\s*=\s*([a-zA-Z0-9_$]+)\s*\?\.\s*data\s*\?\?\s*\1/g,
    (_, subj) => `const data = extractData(${subj})`
  );

  return out;
}

let changedFiles = 0;
const plan = [];

files.forEach((f) => {
  const content = fs.readFileSync(f, "utf8");
  if (
    !/(\?\.\s*data\s*\?\?|\bToast\s+[^>]*show=|\bPromise\.resolve\(|resolved\?\.\s*id|params\?\.\s*id)/.test(
      content
    )
  ) {
    return;
  }
  const newContent = replacePatterns(content);
  if (newContent !== content) {
    let final = newContent;
    if (!final.includes("from '@/lib/utils'")) {
      final = ensureImport(final);
    }
    plan.push({ file: f, beforeLen: content.length, afterLen: final.length });
    if (dry) {
      console.log(`[DRY] would update ${f}`);
    } else {
      fs.writeFileSync(f, final, "utf8");
      console.log(`[APPLY] updated ${f}`);
    }
    changedFiles++;
  }
});

console.log(
  `\nProcessed ${files.length} files. ${changedFiles} files ${
    dry ? "would be modified (dry-run)" : "modified"
  }.`
);
console.log("Note: review changes and run `git diff` before committing.");
