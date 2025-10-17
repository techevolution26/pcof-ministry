// scripts/reverse-patch-extract-data.js
import fs from "fs";
import { globSync } from "glob";

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const dry = !APPLY;
const files = globSync("src/**/*.tsx", { nodir: true });

function reversePatterns(content) {
  let out = content;

  // Reverse extractData(x) back to x?.data ?? x
  out = out.replace(/extractData\(([^)]+)\)/g, "$1?.data ?? $1");

  // Reverse getIdFromParams(x) back to x?.id
  out = out.replace(/getIdFromParams\(([^)]+)\)/g, "$1?.id");

  // Reverse !!() back to original
  out = out.replace(/show=\{!!\(([^}]+)\)\}/g, "show={$1}");

  return out;
}

function removeUnusedImport(content) {
  // Remove the import if extractData and getIdFromParams are no longer used
  const lines = content.split("\n");
  const hasExtractDataUsage = content.includes("extractData(");
  const hasGetIdFromParamsUsage = content.includes("getIdFromParams(");

  if (!hasExtractDataUsage && !hasGetIdFromParamsUsage) {
    return lines
      .filter(
        (line) =>
          !line.includes("from '@/lib/utils'") ||
          !(line.includes("extractData") && line.includes("getIdFromParams"))
      )
      .join("\n");
  }
  return content;
}

let changedFiles = 0;

files.forEach((f) => {
  const content = fs.readFileSync(f, "utf8");
  if (!/(extractData\(|getIdFromParams\()/.test(content)) {
    return;
  }

  let newContent = reversePatterns(content);
  newContent = removeUnusedImport(newContent);

  if (newContent !== content) {
    if (dry) {
      console.log(`[DRY] would reverse ${f}`);
    } else {
      fs.writeFileSync(f, newContent, "utf8");
      console.log(`[APPLY] reversed ${f}`);
    }
    changedFiles++;
  }
});

console.log(
  `\nProcessed ${files.length} files. ${changedFiles} files ${
    dry ? "would be reversed (dry-run)" : "reversed"
  }.`
);
