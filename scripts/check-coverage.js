#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
let requiredStatements = 70;
let requiredLines = 70;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--statements' && argv[i + 1]) {
    requiredStatements = Number(argv[i + 1]);
  }
  if (argv[i] === '--lines' && argv[i + 1]) {
    requiredLines = Number(argv[i + 1]);
  }
}

const summaryPath = path.resolve(process.cwd(), 'coverage', 'coverage-summary.json');
if (!fs.existsSync(summaryPath)) {
  console.error(`Coverage summary not found at ${summaryPath}`);
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const statementsPct = summary.total.statements.pct;
const linesPct = summary.total.lines.pct;

let ok = true;
if (statementsPct < requiredStatements) {
  console.error(`Statements coverage ${statementsPct}% is below required ${requiredStatements}%`);
  ok = false;
}
if (linesPct < requiredLines) {
  console.error(`Lines coverage ${linesPct}% is below required ${requiredLines}%`);
  ok = false;
}

if (!ok) process.exit(1);
console.log(`Coverage OK: statements ${statementsPct}%, lines ${linesPct}%`);
