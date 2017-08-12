import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import {
    Identifier, InterfaceDeclaration, Modifier, ObjectLiteralExpression, Statement, SyntaxKind, TypeElement,
    VariableStatement
} from 'typescript';
import {capitalizeFirstLetter, convertHyphensToCamelCase, removeFileExtension} from '../utils/string-utils';

export const stateInterfaceName = 'State';
export const defaultStateConstantName = 'defaultState';

export const getImportAliasSuffix = (subUiComponentName: string) =>
    capitalizeFirstLetter(convertHyphensToCamelCase(subUiComponentName));
export const getReducerImportAlias = (subUiComponentName: string) => `reducer${getImportAliasSuffix(subUiComponentName)}`;
export const getDefaultStateImportAlias = (subUiComponentName: string) => `defaultState${getImportAliasSuffix(subUiComponentName)}`;
export const getStateImportAlias = (subUiComponentName: string) => `${getImportAliasSuffix(subUiComponentName)}State`;

export const createReducerImports = (subReducerPath: string, subUiComponentName: string): Statement => {
    const importSpecifiers = [
        ts.createImportSpecifier(ts.createIdentifier('reducer'), ts.createIdentifier(getReducerImportAlias(subUiComponentName))),
        ts.createImportSpecifier(ts.createIdentifier('defaultState'), ts.createIdentifier(getDefaultStateImportAlias(subUiComponentName))),
        ts.createImportSpecifier(ts.createIdentifier('State'), ts.createIdentifier(getStateImportAlias(subUiComponentName)))
    ];

    return ts.createImportDeclaration(
        [],
        [],
        ts.createImportClause(undefined, ts.createNamedImports(importSpecifiers)),
        ts.createLiteral(subReducerPath));
};

export const addPropertyToStateInterface = (oldStateInterfaceDeclaration: InterfaceDeclaration, propName: string, uiComponentName: string): Statement => {
    const propModifiers: Modifier[] = [
        ts.createToken(SyntaxKind.ReadonlyKeyword)
    ];
    const members: TypeElement[] = [
        ...oldStateInterfaceDeclaration.members,
        ts.createPropertySignature(
            propModifiers,
            propName,
            undefined,
            ts.createTypeReferenceNode(getStateImportAlias(uiComponentName), []),
            undefined
        )
    ];

    return ts.createInterfaceDeclaration(
        oldStateInterfaceDeclaration.decorators,
        oldStateInterfaceDeclaration.modifiers,
        stateInterfaceName,
        oldStateInterfaceDeclaration.typeParameters,
        oldStateInterfaceDeclaration.heritageClauses,
        members);
};

export const addPropertyToDefaultStateInterface = (oldDefaultStateStmt: VariableStatement, propName: string, uiComponentName: string): Statement => {
    const variableDeclaration = oldDefaultStateStmt.declarationList.declarations[0];
    if (variableDeclaration && variableDeclaration.initializer &&
        variableDeclaration.initializer.kind === SyntaxKind.ObjectLiteralExpression) {
        const objectLiteralExpr = <ObjectLiteralExpression> variableDeclaration.initializer;
        const properties = objectLiteralExpr.properties;

        const newProperty = ts.createPropertyAssignment(
            propName,
            ts.createIdentifier(getDefaultStateImportAlias(uiComponentName))
        );
        properties.push(newProperty)
    }

    return oldDefaultStateStmt;
};

export const isStateInterface = (stmt: Statement): boolean =>
    stmt.kind === SyntaxKind.InterfaceDeclaration && (<InterfaceDeclaration> stmt).name.text === stateInterfaceName;
export const isDefaultStateStatement = (stmt: Statement): boolean =>
    stmt.kind === SyntaxKind.VariableStatement
    && (<Identifier>(<VariableStatement> stmt).declarationList.declarations[0].name).text === defaultStateConstantName;

export const addSubReducer = (parentReducerCode: string, subReducerPath: string, statePropertyName: string) => {
    // TODO: Real path necessary?
    const originalSourceFile = ts.createSourceFile("reducer.ts", parentReducerCode, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
    const resultFile = ts.createSourceFile(path.join(__dirname, "reducer.ts"), "", ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

    const subReducerPathNoFileExt = removeFileExtension(subReducerPath);
    const subUiComponentName = path.basename(subReducerPathNoFileExt);

    let newStatements = [];
    let addedImportStatement = false;

    for (let i = 0; i < originalSourceFile.statements.length; i++) {
        const statement = originalSourceFile.statements[i];

        // Insert new import declaration directly after existing import declarations
        if (!addedImportStatement && statement.kind != SyntaxKind.ImportDeclaration) {
            newStatements.push(createReducerImports(subReducerPathNoFileExt, subUiComponentName));
            addedImportStatement = true;
        }

        if (isStateInterface(statement)) {
            const updatedStateInterface =
                addPropertyToStateInterface(statement as InterfaceDeclaration, statePropertyName, subUiComponentName);
            newStatements.push(updatedStateInterface);
        }
        else if (isDefaultStateStatement(statement)) {
            const updatedDefaultStateStatement =
                addPropertyToDefaultStateInterface(statement as VariableStatement, statePropertyName, subUiComponentName);
            newStatements.push(updatedDefaultStateStatement);
        }
        else {
            newStatements.push(statement);
        }
    }

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

export const execute = (args: string[]) => {
    const parentReducerPath = args[0];
    const subReducerPath = args[1];
    const statePropertyName = args[2];

    // TODO: Use async methods
    const parentReducerFileExists = fs.existsSync(parentReducerPath);
    const parentReducerCode = parentReducerFileExists ? fs.readFileSync(subReducerPath, 'utf8') : '';

    const newCode = addSubReducer(parentReducerCode, subReducerPath, statePropertyName);
    fs.writeFileSync(parentReducerPath, newCode, 'utf8');
};

export const task: TsToolboxTask = {
    argumentInfo: [
        {
            description: 'Path to file of parent reducer',
            required: true
        },
        {
            description: 'Path to file of sub reducer',
            required: true
        },
        {
            description: 'State property name',
            required: true
        }
    ],
    command: 'add-sub-action',
    execute: execute
};