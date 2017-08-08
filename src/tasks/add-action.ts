import * as path from 'path';
import * as ts from 'typescript';
import {Decorator, Modifier, ReadonlyToken, Statement, SyntaxKind, Token, TypeElement} from 'typescript';

export const createInterface = (name: string): Statement => {
    const propModifiers: Modifier[] = [
        ts.createToken(SyntaxKind.ReadonlyKeyword)
    ];
    const members: TypeElement[] = [
        ts.createPropertySignature(
            propModifiers,
            'type',
            undefined,
            ts.createTypeQueryNode(ts.createQualifiedName(ts.createIdentifier('ActionTypes'), name)),
            undefined
        )
    ];
    const stmInterface = ts.createInterfaceDeclaration(
        undefined,
        undefined,
        name,
        undefined,
        undefined,
        members);
    return stmInterface;
};

export const createActionCreator = (name: string) => {
    const actionCreateName = `create${name}`;

    const stmtReturn = ts.createReturn(
        ts.createObjectLiteral(
            [ts.createPropertyAssignment('type', ts.createPropertyAccess(ts.createIdentifier('ActionTypes'), name))]
        )
    );
    const expr = ts.createArrowFunction(
        [],
        [],
        [],
        ts.createTypeReferenceNode(name, []),
        ts.createToken(SyntaxKind.EqualsGreaterThanToken),
        ts.createBlock([stmtReturn], true));
    const declaration = ts.createVariableDeclaration(actionCreateName, undefined, expr);
    const stmActionCreator = ts.createVariableStatement(
        [ts.createToken(SyntaxKind.ExportKeyword), ts.createToken(SyntaxKind.ConstKeyword)],
        [declaration]
    );
    return stmActionCreator;
};

export const addAction = (code: string) => {
    const originalSourceFile = ts.createSourceFile("target.ts", code, ts.ScriptTarget.Latest, /*setParentNodes*/ false, ts.ScriptKind.TS);
    const resultFile = ts.createSourceFile(path.join(__dirname, "someFileName.ts"), "", ts.ScriptTarget.Latest, /*setParentNodes*/ false, ts.ScriptKind.TS);

    var newStatements = [];

    for (var i = 0; i < originalSourceFile.statements.length; i++) {
        const oldStatement = originalSourceFile.statements[i];
        console.log(JSON.stringify(oldStatement));

        //console.log(oldStatement.kind === ts.SyntaxKind.TypeAssertionExpression);
        //if(oldStatement.identifier) {}
        newStatements.push(oldStatement);
    }

    const nameNewAction = 'ActionTestName';
    newStatements.push(createInterface(nameNewAction));
    newStatements.push(createActionCreator(nameNewAction));

    const sourceFile = ts.updateSourceFileNode(originalSourceFile, newStatements);

    const printer = ts.createPrinter(
        {
            // Options
        },
        {
            // PrintHandlers
        });

    try {
        return printer.printNode(ts.EmitHint.Unspecified, sourceFile, resultFile);
    } catch (e) {
        console.log('error: ', e);
    }
};