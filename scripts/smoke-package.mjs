import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
function developmentDependency(name) {
  const spec = pkg.devDependencies[name];
  assert(typeof spec === "string", `Missing development dependency ${name}`);
  return spec.startsWith("file:") ? `file:${resolve(root, spec.slice(5))}` : spec;
}
const target = mkdtempSync(join(tmpdir(), "simulator-editor-package-"));
const packed = JSON.parse(
  execFileSync("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", target], {
    cwd: root,
    encoding: "utf8",
  }),
)[0];
for (const [subpath, entry] of Object.entries(pkg.exports)) {
  const runtime = typeof entry === "string" ? entry : entry.import;
  assert(
    packed.files.some((file) => file.path === runtime.replace(/^\.\//, "")),
    `Missing packed export ${subpath}`,
  );
  if (typeof entry === "object") {
    assert(existsSync(resolve(root, entry.types)), `Missing declarations ${subpath}`);
    await import(pathToFileURL(resolve(root, runtime)).href);
  }
}
writeFileSync(
  join(target, "package.json"),
  JSON.stringify({
    private: true,
    type: "module",
    dependencies: {
      [pkg.name]: `file:${join(target, packed.filename)}`,
      react: "18.3.1",
      "react-dom": "18.3.1",
      "@signalsafe/simulator-core": developmentDependency("@signalsafe/simulator-core"),
      "@signalsafe/simulator-react": developmentDependency("@signalsafe/simulator-react"),
      "@signalsafe/tree-spec-editor-theme-bootstrap": developmentDependency(
        "@signalsafe/tree-spec-editor-theme-bootstrap",
      ),
      "@signalsafe/simulator-theme-bootstrap": developmentDependency(
        "@signalsafe/simulator-theme-bootstrap",
      ),
      bootstrap: "5.3.8",
    },
    overrides: Object.fromEntries(
      ["simulator-core", "simulator-react", "simulator-theme-bootstrap"].map((name) => [
        `@signalsafe/${name}`,
        `$@signalsafe/${name}`,
      ]),
    ),
    devDependencies: {
      typescript: "5.9.3",
      "@types/react": "18.3.0",
      "@types/react-dom": "18.3.0",
    },
  }),
);
execFileSync("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--prefer-online"], {
  cwd: target,
  stdio: "inherit",
});
writeFileSync(
  join(target, "smoke.mjs"),
  `import React from 'react';import {renderToString} from 'react-dom/server';
import {SimulatorEditor} from '${pkg.name}/SimulatorEditor';
const html=renderToString(React.createElement(SimulatorEditor,{sections:[{key:'messages',label:'Messages',value:[]}],onChange:()=>{},renderPreview:()=>React.createElement('p',null,'Preview slot')}));
if(!html.includes('Preview slot')||!html.includes('Shortcuts'))throw new Error('Packed editor did not render');`,
);
execFileSync(process.execPath, ["smoke.mjs"], { cwd: target, stdio: "inherit" });
writeFileSync(
  join(target, "consumer.tsx"),
  `import {SimulatorEditor} from '${pkg.name}/SimulatorEditor';import type {SimulatorEditorProps} from '${pkg.name}/editorTypes';const props:SimulatorEditorProps={sections:[],onChange:()=>{},renderPreview:()=>null};export const editor=<SimulatorEditor {...props}/>;`,
);
execFileSync(
  join(target, "node_modules/.bin/tsc"),
  [
    "--noEmit",
    "--strict",
    "--skipLibCheck",
    "--jsx",
    "react-jsx",
    "--moduleResolution",
    "bundler",
    "--module",
    "esnext",
    "--target",
    "es2020",
    "consumer.tsx",
  ],
  { cwd: target, stdio: "inherit" },
);
console.log(`Packed exports, isolated render and strict consumer types passed: ${target}`);
