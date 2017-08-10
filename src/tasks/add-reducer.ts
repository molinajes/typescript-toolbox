import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import {NodeFlags, Statement, SyntaxKind} from 'typescript';

export const stateInterfaceName = 'State';
export const defaultStateConstName = 'defaultState';
export const reducerFunctionName = `reducer`;

export const createActionImport = (actionPath: string): Statement => {
    const actionIdentifier = ts.createIdentifier('Action');
    return ts.createImportDeclaration(
        [],
        [],
        ts.createImportClause(undefined, ts.createNamedImports([ts.createImportSpecifier(undefined, actionIdentifier)])),
        ts.createLiteral(actionPath));
};

export const createInterface = (): Statement => {
    return ts.createInterfaceDeclaration(
        undefined,
        [ts.createToken(SyntaxKind.ExportKeyword)],
        stateInterfaceName,
        undefined,
        undefined,
        []);
};

const createDefaultStateConstant = () => {
    const expr = ts.createObjectLiteral();
    const declaration = ts.createVariableDeclaration(defaultStateConstName, undefined, expr);
    return ts.createVariableStatement(
        [ts.createToken(SyntaxKind.ExportKeyword)],
        ts.createVariableDeclarationList([declaration], NodeFlags.Const)
    );
};

export const createReducerFunction = () => {
    const paramStateName = 'state';
    const paramActionName = 'action';

    const functionParameters = [
        ts.createParameter(
            [],
            [],
            undefined,
            paramStateName,
            undefined,
            ts.createTypeReferenceNode(stateInterfaceName, [])),
        ts.createParameter(
            [],
            [],
            undefined,
            paramActionName,
            undefined,
            ts.createTypeReferenceNode('Action', []))
    ];

    const stmtReturn = ts.createReturn(
        ts.createIdentifier(paramStateName)
    );

    const expr = ts.createArrowFunction(
        [],
        [],
        functionParameters,
        ts.createTypeReferenceNode(stateInterfaceName, []),
        ts.createToken(SyntaxKind.EqualsGreaterThanToken),
        ts.createBlock([stmtReturn], true));
    const declaration = ts.createVariableDeclaration(reducerFunctionName, undefined, expr);
    return ts.createVariableStatement(
        [ts.createToken(SyntaxKind.ExportKeyword)],
        ts.createVariableDeclarationList([declaration], NodeFlags.Const)
    );
};

export const addReducer = (actionPath: string) => {
    const resultFile = ts.createSourceFile(path.join(__dirname, "reducer.ts"), "", ts.ScriptTarget.Latest, /*setParentNodes*/ false, ts.ScriptKind.TS);

    const newStatements = [
        createActionImport(actionPath),
        createInterface(),
        createDefaultStateConstant(),
        createReducerFunction()
    ];
    const sourceFile = ts.updateSourceFileNode(resultFile, newStatements);

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

export const execute = (args: string[]) => {
    const uiComponentPath = args[0];
    const actionPath = args[1];
    const actionFilePath = path.join(uiComponentPath, 'reducer.ts');
    // TODO: Use async methods
    const actionFileExists = fs.existsSync(actionFilePath);
    const code = actionFileExists ? fs.readFileSync(actionFilePath, 'utf8') : '';

    const newCode = addReducer(actionPath);
    fs.writeFileSync(actionFilePath, newCode, 'utf8');
};

export const task: TsToolBeltTask = {
    argumentInfo: [
        {
            description: 'UI Component Path',
            required: true,
            defaultValue: './'
        },
        {
            description: 'Actions Path',
            required: true
        }
    ],
    command: 'add-action',
    execute: execute
};