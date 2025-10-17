import { Project, SyntaxKind } from "ts-morph";
import { glob } from "glob";
import path from "path";
import fs from "fs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry") || args.includes("-d");
const root = process.cwd();
const pattern = "src/**/*.{ts,tsx,cts,mts}";
const ignore = ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/out/**"];

console.log(`replace-any: dryRun=${dryRun}`);
console.log(`Searching files: ${pattern}`);

const files = glob.sync(pattern, { ignore, nodir: true });
console.log(`Found ${files.length} candidate files (will check for explicit 'any' tokens).`);

if (files.length === 0) {
    console.log("No files found. Exiting.");
    process.exit(0);
}

const project = new Project({
    // Reuse existing tsconfig if present for correct parsing
    tsConfigFilePath: projectTsConfigPathIfExists(),
    skipFileDependencyResolution: true,
    manipulationSettings: {
        // Fixed: Remove invalid property and keep only valid ones
        useTrailingCommas: false,
    },
});

let totalReplacements = 0;
const changedFiles: string[] = [];

for (const f of files) {
    try {
        const sourceFile = project.addSourceFileAtPathIfExists(f);
        if (!sourceFile) continue;

        // collect all explicit AnyKeyword nodes
        const anyNodes = sourceFile.getDescendantsOfKind(SyntaxKind.AnyKeyword);

        // Filter out occurrences that are part of comments / JSDoc? AnyKeyword is type token so comments are not matched.
        if (anyNodes.length === 0) continue;

        // Replace each AnyKeyword with UnknownKeyword (text 'unknown')
        // We'll call replaceWithText on each node.
        // Do replacements from last to first to avoid weird offsets (not strictly required with ts-morph but safe).
        const nodesSorted = anyNodes.slice().reverse();
        let replacedCount = 0;

        for (const node of nodesSorted) {
            // Additional safety: ensure node is not part of a `declare` of a third-party ambient (rare in src).
            // We'll do a conservative replacement: only modify files under /src.
            // (we already restricted files)
            try {
                node.replaceWithText("unknown");
                replacedCount++;
            } catch (err) {
                // If a particular node can't be replaced, skip it.
                // Fixed: Proper error type checking
                const errorMessage = err instanceof Error ? err.message : String(err);
                console.warn(`  skip replace in ${f}: ${errorMessage}`);
            }
        }

        if (replacedCount > 0) {
            totalReplacements += replacedCount;
            changedFiles.push(f);
            if (!dryRun) {
                sourceFile.saveSync();
                console.log(`Updated ${f} — replaced ${replacedCount} 'any' -> 'unknown'`);
            } else {
                console.log(`Would update ${f} — ${replacedCount} replacements (dry)`);
            }
        }
    } catch (err) {
        console.error(`Error processing ${f}:`, err);
    }
}

console.log("=== Summary ===");
console.log(`Files changed: ${changedFiles.length}`);
console.log(`Total replacements: ${totalReplacements}`);
if (dryRun) {
    console.log("Dry run; no files were written. Remove --dry to apply changes.");
} else {
    console.log("Changes written. Please run `git diff` and `npm run build` / `tsc --noEmit` to see follow-up errors.");
}

if (changedFiles.length > 0 && !dryRun) {
    console.log("Recommended next steps:");
    console.log(" 1) git add -p (review changes) or open your editor to review diffs.");
    console.log(" 2) Run `npx tsc --noEmit` to find new type problems and fix them.");
    console.log(" 3) Run your test suite / lint.");
}

function projectTsConfigPathIfExists(): string | undefined {
    const tsconfig = path.join(root, "tsconfig.json");
    const jsconfig = path.join(root, "jsconfig.json");
    // Fixed: Use imported fs module instead of require
    if (fs.existsSync(tsconfig)) return tsconfig;
    if (fs.existsSync(jsconfig)) return jsconfig;
    return undefined;
}