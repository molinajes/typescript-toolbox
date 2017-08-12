import * as path from 'path';
import * as ts from 'typescript';
import * as fs from 'fs';
import {InterfaceDeclaration, NodeFlags, Statement, SyntaxKind} from 'typescript';
import {convertHyphensToCamelCase, removeFileExtension} from '../utils/string-utils';
import {createEmptyInterface, createImport, createUnionTypeDeclaration} from '../utils/ts-utils';

export const componentPropsInterfaceName = 'Props';
export const containerAllPropsTypeName = 'AllProps';
export const componentImportAlias = (componentName: string) => `${componentName}Component`;

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
    createUnionTypeDeclaration(containerAllPropsTypeName, [{type: componentPropsInterfaceName}]);

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

export const execute = (args: string[]) => {
    const uiComponentFile = args[0];
    const fileNameNoExtension = removeFileExtension(path.basename(uiComponentFile));
    const uiComponentName = args[1] || convertHyphensToCamelCase(fileNameNoExtension);
    const dirName = path.dirname(uiComponentFile);

    // TODO: Use async methods
    const componentFileExists = fs.existsSync(uiComponentFile);

    if (!componentFileExists) {
        throw Error(`UI Component does not exist: ${componentFileExists}. 
        Use "ts-codebelt add-component ${dirName}" ${uiComponentName}" to create the component.`);
    }

    if (!fileNameNoExtension.endsWith('-component')) {
        throw new Error(`The components file name does not follow naming conventions: ${uiComponentFile}.
        Expecting file name to end with "-component".`);
    }

    const containerFileName = fileNameNoExtension.substr(0, fileNameNoExtension.length - '-component'.length);
    const containerFilePath = path.join(dirName, `${containerFileName}.ts`);

    const componentCode = componentFileExists ? fs.readFileSync(uiComponentFile, 'utf8') : '';

    const modifiedComponentCode = replacePropsInComponent(componentCode, containerFileName);
    fs.writeFileSync(uiComponentFile, modifiedComponentCode, 'utf8');

    const containerCode = addContainer(containerFilePath, componentCode, uiComponentFile, fileNameNoExtension, uiComponentName);
    fs.writeFileSync(containerFilePath, containerCode, 'utf8');
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