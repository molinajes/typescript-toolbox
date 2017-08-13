import * as path from 'path';
import * as ts from 'typescript';
import * as fs from 'fs';
import {
    Identifier,
    InterfaceDeclaration,
    NodeArray,
    NodeFlags,
    Statement,
    SyntaxKind,
    TypeAliasDeclaration,
    TypeNode,
    UnionOrIntersectionTypeNode,
    VariableStatement
} from 'typescript';
import {convertHyphensToCamelCase, removeFileExtension} from '../utils/string-utils';
import {createArrowFunction, createEmptyInterface, createImport} from '../utils/ts-utils';
import {containerAllPropsTypeName} from './add-container';

export const componentPropsInterfaceName = 'Props';
export const reduxStatePropsInterfaceName = 'ReduxStateProps';
export const reduxDispatchPropsInterfaceName = 'ReduxDispatchProps';
export const mapStateToPropsMethodName = 'mapStateToProps';
export const mapDispatchToPropsMethodName = 'mapDispatchToProps';
export const withReduxConstantName = 'withRedux';

export const addReactReduxImport = (): Statement =>
    createImport([{element: 'connect'}, {element: 'Disptach'}], 'react-redux');

export const addReduxStatePropsInterface = (): Statement =>
    createEmptyInterface(reduxStatePropsInterfaceName);

export const addReduxDispatchPropsInterface = (): Statement =>
    createEmptyInterface(reduxDispatchPropsInterfaceName);

export const updateAllPropsTypeDeclaration = (oldStmt: TypeAliasDeclaration): Statement => {
    const stmt = !!oldStmt ? oldStmt : ts.createTypeAliasDeclaration([],
        [ts.createToken(SyntaxKind.ExportKeyword)],
        'Action',
        [],
        ts.createUnionTypeNode([]));

    if (stmt.kind === SyntaxKind.TypeAliasDeclaration) {
        const typeAliasDeclaration = <TypeAliasDeclaration> stmt;
        const type = typeAliasDeclaration.type;

        let types: NodeArray<TypeNode> = ts.createNodeArray();

        if (type.kind === SyntaxKind.IntersectionType) {
            const intersectionType = (<UnionOrIntersectionTypeNode> type);
            types = intersectionType.types;
        } else if (type.kind === SyntaxKind.TypeReference) {
            types.push(type);
        }
        types.push(ts.createTypeReferenceNode(reduxStatePropsInterfaceName, []));
        types.push(ts.createTypeReferenceNode(reduxDispatchPropsInterfaceName, []));

        const updatedUnionType = ts.createUnionTypeNode(types);
        return ts.updateTypeAliasDeclaration(
            typeAliasDeclaration,
            [],
            [ts.createToken(SyntaxKind.ExportKeyword)],
            typeAliasDeclaration.name,
            [],
            updatedUnionType);
    }

    return stmt;
};

export const addMapStateToProps = () =>
    createArrowFunction(mapStateToPropsMethodName, [], reduxStatePropsInterfaceName);

export const addMapDispatchToProps = () =>
    createArrowFunction(mapDispatchToPropsMethodName, [], reduxDispatchPropsInterfaceName);

export const addWithReduxConstant = () => {
    const typeArgs = [
        ts.createTypeReferenceNode(ts.createIdentifier(reduxStatePropsInterfaceName), []),
        ts.createTypeReferenceNode(ts.createIdentifier(reduxDispatchPropsInterfaceName), []),
        ts.createTypeReferenceNode(ts.createIdentifier(componentPropsInterfaceName), [])
    ];
    const expr = ts.createCall(
        ts.createIdentifier('connect'),
        typeArgs,
        [
            ts.createIdentifier(mapStateToPropsMethodName),
            ts.createIdentifier(mapDispatchToPropsMethodName)
        ]
    );
    const declaration = ts.createVariableDeclaration(withReduxConstantName, undefined, expr);
    return ts.createVariableStatement(
        [ts.createToken(SyntaxKind.ExportKeyword)],
        ts.createVariableDeclarationList([declaration], NodeFlags.Const)
    );
};

export const updateComponentConstantWithRedux = (oldStatement: VariableStatement): Statement => {
    const decl = oldStatement.declarationList.declarations[0];
    if (!decl) {
        console.log('Could not update exported component. ');
        return oldStatement;
    }

    const oldExpr = decl.initializer;
    const newExpr = ts.createCall(ts.createIdentifier(withReduxConstantName), undefined, [oldExpr]);
    const updatedVariableDeclaration = ts.updateVariableDeclaration(decl, decl.name, decl.type, newExpr);
    const updatedVariableDeclarationList = ts.updateVariableDeclarationList(oldStatement.declarationList, [updatedVariableDeclaration]);
    return ts.updateVariableStatement(oldStatement, oldStatement.modifiers, updatedVariableDeclarationList);
};

export const isPropsInterface = (stmt: Statement): boolean =>
    stmt && stmt.kind === SyntaxKind.InterfaceDeclaration && (<InterfaceDeclaration> stmt).name.text === componentPropsInterfaceName;

export const isAllPropsType = (stmt: Statement): boolean =>
    stmt && stmt.kind === SyntaxKind.TypeAliasDeclaration && (<InterfaceDeclaration> stmt).name.text === containerAllPropsTypeName;

export const isComponentConstant = (stmt: Statement, componentName: string): boolean =>
    stmt && stmt.kind === SyntaxKind.VariableStatement && ((<VariableStatement> stmt).declarationList.declarations[0].name as Identifier).text === componentName;

export const addRedux = (code: string, componentName: string) => {
    // TODO: Real path necessary
    const componentFile = ts.createSourceFile('component.tsx', code, ts.ScriptTarget.Latest, false, ts.ScriptKind.TSX);

    let newStatements = [];
    let addedImportStatement = false;

    for (let i = 0; i < componentFile.statements.length; i++) {
        const statement = componentFile.statements[i];

        // Insert new import declaration directly after existing import declarations
        if (!addedImportStatement && statement.kind != SyntaxKind.ImportDeclaration) {
            newStatements.push(addReactReduxImport());
            addedImportStatement = true;
        }

        if (isPropsInterface(statement)) {
            // Add redux interfaces after props interface
            newStatements.push(statement);

            newStatements.push(addReduxStatePropsInterface());
            newStatements.push(addReduxDispatchPropsInterface());
        }
        else if (isAllPropsType(statement)) {
            newStatements.push(updateAllPropsTypeDeclaration(statement as TypeAliasDeclaration));

            // Add mapStateToProps and mapDispatchToProps after AllProps type declaration
            newStatements.push(addMapStateToProps());
            newStatements.push(addMapDispatchToProps());
        }
        else if (isComponentConstant(statement, componentName)) {
            newStatements.push(addWithReduxConstant());
            newStatements.push(updateComponentConstantWithRedux(statement as VariableStatement));
        }
        else {
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
    const uiContainerFile = args[0];
    const fileNameNoExtension = removeFileExtension(path.basename(uiContainerFile));
    const uiComponentName = args[1] || convertHyphensToCamelCase(fileNameNoExtension);
    const dirName = path.dirname(uiContainerFile);

    // TODO: Use async methods
    const componentFileExists = fs.existsSync(uiContainerFile);

    if (!componentFileExists) {
        throw Error(`UI Component does not exist: ${uiContainerFile}. `);
    }
    const code = componentFileExists ? fs.readFileSync(uiContainerFile, 'utf8') : '';

    const modifiedCode = addRedux(code, uiComponentName);
    fs.writeFileSync(uiContainerFile, modifiedCode, 'utf8');
};

export const task: TsToolboxTask = {
    argumentInfo: [
        {
            description: 'Container File',
            required: true
        },
        {
            description: 'UI Component Name',
            required: false
        }
    ],
    command: 'add-redux',
    execute: execute
};