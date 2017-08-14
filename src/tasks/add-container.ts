import * as path from 'path';
import * as ts from 'typescript';
import {InterfaceDeclaration, NodeFlags, Statement, SyntaxKind} from 'typescript';
import {capitalizeFirstLetter, convertHyphensToCamelCase, removeFileExtension} from '../utils/string-utils';
import {
    createEmptyInterface, createImport, createIntersectionTypeDeclaration
} from '../utils/ts-utils';

export const componentPropsInterfaceName = 'Props';
export const containerAllPropsTypeName = 'AllProps';
export const componentImportAlias = (componentName: string) => `${capitalizeFirstLetter(componentName)}Component`;

export const addPropsImport = (containerFileName: string): Statement =>
    createImport(
        [{
            element: containerAllPropsTypeName,
            alias: componentPropsInterfaceName
        }],
        `./${containerFileName}`
    );

export const addComponentImport = (componentName: string, componentFileName: string): Statement =>
    createImport([{element: componentName, alias: componentImportAlias(componentName)}], `./${componentFileName}`);

export const addAllPropsType = () =>
    createIntersectionTypeDeclaration(containerAllPropsTypeName, [{type: componentPropsInterfaceName}]);

export const createContainerConstant = (componentName: string) => {
    const expr = ts.createIdentifier(componentImportAlias(componentName));
    const declaration = ts.createVariableDeclaration(componentName, undefined, expr);
    return ts.createVariableStatement(
        [ts.createToken(SyntaxKind.ExportKeyword)],
        ts.createVariableDeclarationList([declaration], NodeFlags.Const)
    );
};

export const createInterface = (): Statement =>
    createEmptyInterface(componentPropsInterfaceName);

export const addContainer = (containerFilePath: string,
                             componentCode: string,
                             componentFilePath: string,
                             componentFileNameNoExtension: string,
                             componentName: string) => {
    const componentSourceFile = ts.createSourceFile(componentFilePath, componentCode, ts.ScriptTarget.Latest, false, ts.ScriptKind.TSX);
    const resultFile = ts.createSourceFile(containerFilePath, "", ts.ScriptTarget.Latest, false, ts.ScriptKind.TSX);
    let newStatements = [];

    newStatements.push(addComponentImport(componentName, componentFileNameNoExtension));

    // Copy 'Props' interface from component if exists
    const componentPropsDeclaration = componentSourceFile.statements.find(s => isPropsInterface(s));
    if (componentPropsDeclaration) {
        newStatements.push(componentPropsDeclaration);
    } else {
        newStatements.push(createInterface());
    }

    newStatements.push(addAllPropsType());
    newStatements.push(createContainerConstant(componentName));

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

export const isPropsInterface = (stmt: Statement): boolean =>
    stmt && stmt.kind === SyntaxKind.InterfaceDeclaration && (<InterfaceDeclaration> stmt).name.text === componentPropsInterfaceName;

export const replacePropsInComponent = (code: string, containerFileName: string) => {
    // TODO: Real path necessary
    const componentFile = ts.createSourceFile('component.tsx', code, ts.ScriptTarget.Latest, false, ts.ScriptKind.TSX);

    let newStatements = [];
    let addedImportStatement = false;

    for (let i = 0; i < componentFile.statements.length; i++) {
        const statement = componentFile.statements[i];

        // Insert new import declaration directly after existing import declarations
        if (!addedImportStatement && statement.kind != SyntaxKind.ImportDeclaration) {
            newStatements.push(addPropsImport(containerFileName));
            addedImportStatement = true;
        }

        if (!isPropsInterface(statement)) {
            newStatements.push(statement);
        }
    }

    const sourceFile = ts.updateSourceFileNode(componentFile, newStatements);

    const printer = ts.createPrinter(
        {
            // Options
        },
        {
            // PrintHandlers
        });

    try {
        return printer.printNode(ts.EmitHint.Unspecified, sourceFile, componentFile);
    } catch (e) {
        console.log('error: ', e);
    }
};

export const componentNameFromComponentFilePath = (containerFilePath: string) => {
    const fileNameNoExtension = removeFileExtension(path.basename(containerFilePath));
    return capitalizeFirstLetter(convertHyphensToCamelCase(fileNameNoExtension));
};

export const execute = (args: string[], readFile: (path: string) => string, writeFile: (path: string, content: string) => void) => {
    const uiComponentFile = args[0];
    const fileNameNoExtension = removeFileExtension(path.basename(uiComponentFile));
    const containerFileName = fileNameNoExtension.substr(0, fileNameNoExtension.length - '-component'.length);
    const uiComponentName = args[1] || componentNameFromComponentFilePath(containerFileName);
    const dirName = path.dirname(uiComponentFile);

    // TODO: Use async methods
    const componentCode = readFile(uiComponentFile);

    if (!componentCode || componentCode.length === 0) {
        throw Error(`UI Component does not exist: ${uiComponentFile}. 
        Use "ts-codebelt add-component ${dirName}" ${uiComponentName}" to create the component.`);
    }

    if (!fileNameNoExtension.endsWith('-component')) {
        throw new Error(`The components file name does not follow naming conventions: ${uiComponentFile}.
        Expecting file name to end with "-component".`);
    }

    const containerFilePath = path.join(dirName, `${containerFileName}.ts`);

    const modifiedComponentCode = replacePropsInComponent(componentCode, containerFileName);
    writeFile(uiComponentFile, modifiedComponentCode);

    const containerCode = addContainer(containerFilePath, componentCode, uiComponentFile, fileNameNoExtension, uiComponentName);
    writeFile(containerFilePath, containerCode);
};

export const task: TsToolboxTask = {
    argumentInfo: [
        {
            description: 'UI Component File',
            required: true
        },
        {
            description: 'UI Component Name',
            required: false,
            defaultValue: 'Name of existing component'
        }
    ],
    command: 'add-container',
    execute: execute
};