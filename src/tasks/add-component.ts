import * as path from 'path';
import * as ts from 'typescript';
import {NodeFlags, Statement, SyntaxKind} from 'typescript';
import {convertCamelCaseToHyphens} from '../utils/string-utils';
import {createEmptyInterface, createImport, createNamespaceImport} from '../utils/ts-utils';

export const componentPropsInterfaceName = 'Props';
export type AddComponentType = 'stateless' | 'class' | 'stateful';

export const createImports = (type: AddComponentType): Statement[] => {
    const reactImport = createNamespaceImport('React', 'react');

    const importedComponent = type === 'class' ? 'Component' : (type === 'stateless' ? 'StatelessComponent' : 'Component');

    const componentImport = createImport([{element: importedComponent}], 'react');
    return [reactImport, componentImport];
};

export const createInterface = (): Statement =>
    createEmptyInterface(componentPropsInterfaceName);

export const createStatelessComponent = (name: string) => {
    const stmtReturn = ts.createReturn(
        ts.createJsxSelfClosingElement(ts.createIdentifier('div'), ts.createJsxAttributes([]))
    );
    const propParameter = ts.createParameter(
        undefined,
        undefined,
        undefined,
        'props',
        undefined,
        ts.createTypeReferenceNode(ts.createIdentifier(componentPropsInterfaceName), []));
    const expr = ts.createArrowFunction(
        [],
        [],
        [propParameter],
        undefined,
        ts.createToken(SyntaxKind.EqualsGreaterThanToken),
        ts.createBlock([stmtReturn], true));
    const declaration = ts.createVariableDeclaration(
        name,
        ts.createTypeReferenceNode('StatelessComponent', [ts.createTypeReferenceNode(ts.createIdentifier('Props'), [])]), expr);
    return ts.createVariableStatement(
        [ts.createToken(SyntaxKind.ExportKeyword)],
        ts.createVariableDeclarationList([declaration], NodeFlags.Const)
    );
};

export const addComponent = (componentFilePath: string, componentName: string, componentType: AddComponentType) => {
    const resultFile = ts.createSourceFile(componentFilePath, "", ts.ScriptTarget.Latest, false, ts.ScriptKind.TSX);
    let newStatements = [];

    createImports(componentType).forEach(stmt => newStatements.push(stmt));
    newStatements.push(createInterface());

    switch (componentType) {
        case 'class':
        case 'stateful':
            throw new Error('Component type not supported yet.');
        case 'stateless':
            newStatements.push(createStatelessComponent(componentName));
            break;
    }

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

export const execute = (args: string[], readFile: (path: string) => string, writeFile: (path: string, content: string) => void) => {
    const uiComponentPath = args[0];
    const uiComponentName = args[1];

    let componentType: AddComponentType = 'stateless';
    switch (args[2]) {
        case 'class':
            componentType = 'class';
            break;
        case 'stateful':
            componentType = 'stateful';
            break;
    }

    const fileName = `${convertCamelCaseToHyphens(uiComponentName)}-component.tsx`;
    const componentFilePath = path.join(uiComponentPath, fileName);

    const existingCode = readFile(componentFilePath);

    if (existingCode && existingCode.length > 0) {
        throw Error(`File already exists: ${componentFilePath}`);
    }

    const newCode = addComponent(componentFilePath, uiComponentName, componentType);
    writeFile(componentFilePath, newCode);
};

export const task: TsToolboxTask = {
    argumentInfo: [
        {
            description: 'UI Component Path',
            required: true
        },
        {
            description: 'UI Component Name',
            required: true
        },
        {
            description: 'Component type ("class", "stateless", "stateful")',
            required: false,
            defaultValue: 'stateless'
        }
    ],
    command: 'add-component',
    execute: execute
};