import * as path from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';
import * as program from 'commander';

program
    .version('0.1.0')
    .option('-p, --peppers', 'Add peppers')
    .option('-P, --pineapple', 'Add pineapple')
    .option('-b, --bbq-sauce', 'Add bbq sauce')
    .option('-c, --cheese [type]', 'Add the specified type of cheese [marble]', 'marble')
    .parse(process.argv);

const code = fs.readFileSync(path.join(__dirname, 'target.ts'), 'utf8');

var sourceFile = ts.createSourceFile("target.ts", code, ts.ScriptTarget.Latest, /*setParentNodes*/ false, ts.ScriptKind.TS);
const resultFile = ts.createSourceFile(path.join(__dirname, "someFileName.ts"), "", ts.ScriptTarget.Latest, /*setParentNodes*/ false, ts.ScriptKind.TS);

console.log(sourceFile.kind);
var newStatements = [];

for (var i = 0; i < sourceFile.statements.length; i++) {
    const oldStatement = sourceFile.statements[i];

    console.log(oldStatement.kind === ts.SyntaxKind.TypeAssertionExpression);
    //if(oldStatement.identifier) {}

    newStatements.push(oldStatement);
}

sourceFile = ts.updateSourceFileNode(sourceFile, newStatements);

const printer = ts.createPrinter(
    {
        // Options
    },
    {
        // PrintHandlers
    });

try {
    const r = printer.printNode(ts.EmitHint.Unspecified, sourceFile, resultFile);
    console.log(r);
} catch (e) {
    console.log('error: ', e);
}

console.log('done');