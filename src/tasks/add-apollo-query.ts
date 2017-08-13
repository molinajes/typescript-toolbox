import * as path from 'path';
import * as ts from 'typescript';
import {
    Identifier,
    ImportDeclaration, NamedImports, NodeArray, NodeFlags, Statement, StringLiteral, SyntaxKind,
    TypeAliasDeclaration, TypeNode, TypeReferenceNode, UnionOrIntersectionTypeNode, VariableStatement
} from 'typescript';
import {capitalizeFirstLetter, convertHyphensToCamelCase, removeFileExtension} from '../utils/string-utils';
import {createImport, createNamespaceImport} from '../utils/ts-utils';
import {componentPropsInterfaceName, containerAllPropsTypeName} from './add-container';
import {addWithReduxConstant, isAllPropsType, isComponentConstant} from './add-redux';

export const apolloPropsTypeName = 'ApolloProps';
export const withApolloConstantName = 'withApollo';

export const getDataPropTypeName = (name: string) => `${capitalizeFirstLetter(name)}DataProp`;

export const addApolloImport = (): Statement =>
    createImport([{element: 'graphql'}, {element: 'DefaultChildProps'}], 'react-apollo');

export const addGraphQlFilePath = (queryName: string, graphQlFilePath: string): Statement =>
    createNamespaceImport(queryName, graphQlFilePath);

export const addQueryModelImport = (queryModelTypeName: string, queryVariablesTypeName: string, queryModelsFilePath: string): Statement =>
    createImport([{element: queryModelTypeName}, {element: queryVariablesTypeName}], queryModelsFilePath);

export const createQueryType = (queryName: string, queryModelTypeName: string | any) => {
    const queryModelType = queryModelTypeName ? queryModelTypeName : 'any';
    return ts.createTypeAliasDeclaration(
        [],
        [ts.createToken(SyntaxKind.ExportKeyword)],
        getDataPropTypeName(queryName),
        [],
        ts.createTypeReferenceNode(
            'DefaultChildProps',
            [
                ts.createTypeReferenceNode(componentPropsInterfaceName, []),
                ts.createTypeReferenceNode(queryModelType, []),
            ]
        )
    );
};

export const updateApolloPropsTypeDeclaration = (oldStmt: TypeAliasDeclaration, queryName: string): Statement => {
    const stmt = !!oldStmt ? oldStmt : ts.createTypeAliasDeclaration([],
        [ts.createToken(SyntaxKind.ExportKeyword)],
        apolloPropsTypeName,
        [],
        ts.createIntersectionTypeNode([]));

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
        types.push(ts.createTypeReferenceNode(getDataPropTypeName(queryName), []));

        const updatedUnionType = ts.createIntersectionTypeNode(types);
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

export const updateAllPropsTypeDeclaration = (oldStmt: TypeAliasDeclaration): Statement => {
    const stmt = !!oldStmt ? oldStmt : ts.createTypeAliasDeclaration([],
        [ts.createToken(SyntaxKind.ExportKeyword)],
        containerAllPropsTypeName,
        [],
        ts.createIntersectionTypeNode([]));

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

        const apolloPropsPresent = types.some(t => ts.isTypeReferenceNode(t)
            && (<TypeReferenceNode> t).typeName.kind === SyntaxKind.Identifier
            && (<Identifier> (<TypeReferenceNode> t).typeName).text === apolloPropsTypeName);

        if (!apolloPropsPresent) {
            types.push(ts.createTypeReferenceNode(apolloPropsTypeName, []));
        }

        const updatedUnionType = ts.createIntersectionTypeNode(types);
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

export const isApolloImport = (stmt: Statement) => {
    if (stmt.kind !== SyntaxKind.ImportDeclaration) {
        return false;
    }

    const importDecl = stmt as ImportDeclaration;
    if (importDecl.moduleSpecifier.kind !== SyntaxKind.StringLiteral
        || (<StringLiteral> importDecl.moduleSpecifier).text !== 'react-apollo') {
        return false;
    }

    if (importDecl.importClause.namedBindings
        && importDecl.importClause.namedBindings.kind == SyntaxKind.NamedImports) {
        const elements = (<NamedImports> importDecl.importClause.namedBindings).elements;
        return elements.some(e => e.name.text === 'graphql' || e.propertyName.text === 'graphql');
    }

    return false;
};

export const addWithApolloConstant = (queryName: string) => {
    const expr = ts.createCall(
        ts.createIdentifier('graphql'),
        undefined,
        [
            ts.createIdentifier(queryName)
        ]
    );
    const declaration = ts.createVariableDeclaration(withApolloConstantName, undefined, expr);
    return ts.createVariableStatement(
        [ts.createToken(SyntaxKind.ExportKeyword)],
        ts.createVariableDeclarationList([declaration], NodeFlags.Const)
    );
};

export const updateComponentConstantWithApollo = (oldStatement: VariableStatement): Statement => {
    const decl = oldStatement.declarationList.declarations[0];
    if (!decl) {
        console.log('Could not update exported component. ');
        return oldStatement;
    }

    const oldExpr = decl.initializer;
    const newExpr = ts.createCall(ts.createIdentifier(withApolloConstantName), undefined, [oldExpr]);
    const updatedVariableDeclaration = ts.updateVariableDeclaration(decl, decl.name, decl.type, newExpr);
    const updatedVariableDeclarationList = ts.updateVariableDeclarationList(oldStatement.declarationList, [updatedVariableDeclaration]);
    return ts.updateVariableStatement(oldStatement, oldStatement.modifiers, updatedVariableDeclarationList);
};

export const isQueryDataModel = (stmt: Statement) =>
    stmt.kind === SyntaxKind.TypeAliasDeclaration && (<TypeAliasDeclaration> stmt).name.text.endsWith('Query');

export const getQueryDataModelTypeName = (stmts: Statement[]): string | undefined => {
    const stmt = stmts.find(isQueryDataModel);
    return stmt && stmt.kind === SyntaxKind.TypeAliasDeclaration ? (<TypeAliasDeclaration> stmt).name.text : undefined;
};

export const isQueryVariablesModel = (stmt: Statement) =>
    stmt.kind === SyntaxKind.TypeAliasDeclaration && (<TypeAliasDeclaration> stmt).name.text.endsWith('Variables');

export const getQueryVariablesTypeName = (stmts: Statement[]): string | undefined => {
    const stmt = stmts.find(isQueryVariablesModel);
    return stmt && stmt.kind === SyntaxKind.TypeAliasDeclaration ? (<TypeAliasDeclaration> stmt).name.text : undefined;
};

export const isApolloPropsType = (stmt: Statement): boolean =>
    stmt && stmt.kind === SyntaxKind.TypeAliasDeclaration && (<TypeAliasDeclaration> stmt).name.text === apolloPropsTypeName;

export const addApolloQuery = (code: string, graphQlFilePath: string, queryName: string, queryModelsFilePath: string, queryModelsCode: string, componentName: string) => {
    // TODO: Use real path?
    const originalSourceFile = ts.createSourceFile("container.ts", code, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

    const queryModelsSourceFile = ts.createSourceFile("query-models.ts", queryModelsCode, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
    const queryModelsTypeName = getQueryDataModelTypeName(queryModelsSourceFile.statements);
    const queryVariablesTypeName = getQueryVariablesTypeName(queryModelsSourceFile.statements);

    const apolloPropsExist = originalSourceFile.statements.some(isApolloPropsType);
    let newStatements = [];

    const addGraphQlImports = !originalSourceFile.statements.some(isApolloImport);
    let addedImports = false;

    for (let i = 0; i < originalSourceFile.statements.length; i++) {
        const statement = originalSourceFile.statements[i];

        // Insert new import declaration directly after existing import declarations
        if (!addedImports && statement.kind != SyntaxKind.ImportDeclaration) {
            if (addGraphQlImports) {
                newStatements.push(addApolloImport());
            }
            newStatements.push(addGraphQlFilePath(queryName, graphQlFilePath));

            if (queryModelsTypeName || queryVariablesTypeName) {
                newStatements.push(addQueryModelImport(queryModelsTypeName, queryVariablesTypeName, queryModelsFilePath));
            }
            addedImports = true;
        }
        else if (apolloPropsExist && isApolloPropsType(statement)) {
            newStatements.push(updateApolloPropsTypeDeclaration(statement as TypeAliasDeclaration, queryName));
        }
        else if (isAllPropsType(statement)) {
            newStatements.push(createQueryType(queryName, queryModelsTypeName));
            if (!apolloPropsExist) {
                newStatements.push(updateApolloPropsTypeDeclaration(undefined, queryName));
            }
            newStatements.push(updateAllPropsTypeDeclaration(statement as TypeAliasDeclaration));
        }
        else if (isComponentConstant(statement, componentName)) {
            newStatements.push(addWithApolloConstant(queryName));
            newStatements.push(updateComponentConstantWithApollo(statement as VariableStatement));
        }
        else {
            newStatements.push(statement);
        }
    }

    const updatedSourceFile = ts.updateSourceFileNode(originalSourceFile, newStatements);

    const printer = ts.createPrinter(
        {
            // Options
        },
        {
            // PrintHandlers
        });

    try {
        return printer.printNode(ts.EmitHint.Unspecified, updatedSourceFile, updatedSourceFile);
    } catch (e) {
        console.log('error: ', e);
    }
};

export const execute = (args: string[], readFile: (path: string) => string, writeFile: (path: string, content: string) => void) => {
    const containerFilePath = args[0];
    const graphqlFilePath = args[1];
    const fileNameNoExtension = removeFileExtension(path.basename(graphqlFilePath));
    const queryName = args[2] || convertHyphensToCamelCase(fileNameNoExtension);
    const graphQlDirPath = path.dirname(graphqlFilePath);
    const queryModelsFilePath = args[3] || path.join(graphQlDirPath, `${fileNameNoExtension}-models.ts`);
    const componentName = args[4] || convertHyphensToCamelCase(fileNameNoExtension);

    const code = readFile(containerFilePath);
    const queryModelsCode = readFile(queryModelsFilePath);

    const newCode = addApolloQuery(code, graphqlFilePath, queryName, queryModelsFilePath, queryModelsCode, componentName);
    writeFile(graphqlFilePath, newCode);
};

export const task: TsToolboxTask = {
    argumentInfo: [
        {
            description: 'Container File Path',
            required: true
        },
        {
            description: 'GraphQl File Path',
            required: true
        },
        {
            description: 'Query Name',
            required: false
        },
        {
            description: 'Query Models File Path',
            required: false
        },
        {
            description: 'Component Name',
            required: false
        }
    ],
    command: 'add-apollo-query',
    execute: execute
};