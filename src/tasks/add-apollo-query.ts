import * as path from 'path';
import * as ts from 'typescript';
import {
    CallExpression, Expression,
    Identifier,
    ImportDeclaration, NamedImports, NodeArray, NodeFlags, Statement, StringLiteral, SyntaxKind,
    TypeAliasDeclaration, TypeNode, TypeReferenceNode, UnionOrIntersectionTypeNode, VariableStatement
} from 'typescript';
import {capitalizeFirstLetter, convertHyphensToCamelCase, removeFileExtension} from '../utils/string-utils';
import {createImport, createNamespaceImport} from '../utils/ts-utils';
import {componentPropsInterfaceName, containerAllPropsTypeName} from './add-container';
import {isAllPropsType, isComponentConstant} from './add-redux';

export const apolloPropsTypeName = 'ApolloProps';
export const withApolloConstantName = 'withApollo';

export const getDataPropTypeName = (name: string) => `${capitalizeFirstLetter(name)}DataProp`;

export const addApolloImport = (): Statement =>
    createImport([{element: 'graphql'}, {element: 'DefaultChildProps'}], 'react-apollo');

export const addComposeImport = (): Statement =>
    createImport([{element: 'compose'}], 'redux');

export const addGraphQlFilePath = (queryName: string, graphQlFilePath: string): Statement =>
    createNamespaceImport(queryName, graphQlFilePath);

export const addQueryModelImport = (queryModelTypeName: string, queryVariablesTypeName: string, queryModelsFilePath: string): Statement =>
    createImport([{element: queryModelTypeName}, {element: queryVariablesTypeName}], removeFileExtension(queryModelsFilePath));

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
export const updateWithApolloConstant = (oldStmt: VariableStatement, queryName: string) => {
    const oldVariableDeclaration = oldStmt.declarationList.declarations[0];
    const oldExpr = oldStmt.declarationList.declarations[0].initializer;

    const expr = ts.createCall(
        ts.createIdentifier('graphql'),
        undefined,
        [
            ts.createIdentifier(queryName)
        ]
    );

    let newExpr: Expression = undefined;

    if (oldExpr.kind === SyntaxKind.CallExpression
        && (<CallExpression> oldExpr).expression.kind === SyntaxKind.Identifier
        && (<Identifier> (<CallExpression> oldExpr).expression).text === 'compose') {
        const composeCallExpr = oldExpr as CallExpression;
        const oldComposeArgs = (<CallExpression> oldExpr).arguments;
        const newComposeArgs = oldComposeArgs.concat([expr]);
        newExpr = ts.updateCall(composeCallExpr, composeCallExpr.expression, composeCallExpr.typeArguments, newComposeArgs);
    } else {
        newExpr = ts.createCall(ts.createIdentifier('compose'), undefined, [oldExpr, expr]);
    }

    const declaration = ts.updateVariableDeclaration(oldVariableDeclaration, oldVariableDeclaration.name, oldVariableDeclaration.type, newExpr);
    const declarationList = ts.updateVariableDeclarationList(oldStmt.declarationList, [declaration]);
    return ts.updateVariableStatement(
        oldStmt,
        [ts.createToken(SyntaxKind.ExportKeyword)],
        declarationList
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

export const isComposeImport = (stmt: Statement) =>
    stmt.kind === SyntaxKind.ImportDeclaration && (<ImportDeclaration> stmt).importClause.namedBindings.kind === SyntaxKind.NamedImports
    && (<NamedImports>(<ImportDeclaration> stmt).importClause.namedBindings).elements.some(e => e.name.text === 'compose');

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

export const isWithApolloConstant = (stmt: Statement): boolean =>
    stmt && stmt.kind === SyntaxKind.VariableStatement
    && (<VariableStatement> stmt).declarationList.declarations[0]
    && (<VariableStatement> stmt).declarationList.declarations[0].name.kind === SyntaxKind.Identifier
    && (<Identifier> (<VariableStatement> stmt).declarationList.declarations[0].name).text === withApolloConstantName;

export const addApolloQuery = (code: string, relativeGraphQlFilePath: string, queryName: string, relativeQueryModelsFilePath: string, queryModelsCode: string, componentName: string) => {
    // TODO: Use real path?
    const originalSourceFile = ts.createSourceFile("container.ts", code, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

    const queryModelsSourceFile = ts.createSourceFile("query-models.ts", queryModelsCode, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
    const queryModelsTypeName = getQueryDataModelTypeName(queryModelsSourceFile.statements);
    const queryVariablesTypeName = getQueryVariablesTypeName(queryModelsSourceFile.statements);

    const apolloPropsExist = originalSourceFile.statements.some(isApolloPropsType);
    const withApolloConstantExists = originalSourceFile.statements.some(isWithApolloConstant);
    const needComposeImport = withApolloConstantExists;
    const composeImportExists = originalSourceFile.statements.some(isComposeImport);
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
            newStatements.push(addGraphQlFilePath(queryName, relativeGraphQlFilePath));

            if (queryModelsTypeName || queryVariablesTypeName) {
                newStatements.push(addQueryModelImport(queryModelsTypeName, queryVariablesTypeName, relativeQueryModelsFilePath));
            }

            if (needComposeImport && !composeImportExists) {
                newStatements.push(addComposeImport());
            }
            addedImports = true;
            newStatements.push(statement);
        }
        else if (isApolloPropsType(statement)) {
            newStatements.push(createQueryType(queryName, queryModelsTypeName));
            newStatements.push(updateApolloPropsTypeDeclaration(statement as TypeAliasDeclaration, queryName));
        }
        else if (isAllPropsType(statement)) {
            if (!apolloPropsExist) {
                newStatements.push(createQueryType(queryName, queryModelsTypeName));
                newStatements.push(updateApolloPropsTypeDeclaration(undefined, queryName));
            }
            newStatements.push(updateAllPropsTypeDeclaration(statement as TypeAliasDeclaration));
        }
        else if (isWithApolloConstant(statement)) {
            newStatements.push(updateWithApolloConstant(statement as VariableStatement, queryName));
        }
        else if (isComponentConstant(statement, componentName)) {
            if (!withApolloConstantExists) {
                newStatements.push(addWithApolloConstant(queryName));
                newStatements.push(updateComponentConstantWithApollo(statement as VariableStatement));
            } else {
                newStatements.push(statement);
            }
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
    const containerFileNameNoExtension = removeFileExtension(path.basename(containerFilePath));
    const graphQlFileNameNoExtension = removeFileExtension(path.basename(graphqlFilePath));
    const queryName = args[2] || convertHyphensToCamelCase(graphQlFileNameNoExtension);
    const graphQlDirPath = path.dirname(graphqlFilePath);
    const queryModelsFilePath = args[3] || path.join(graphQlDirPath, `${graphQlFileNameNoExtension}-models.ts`);
    const componentName = args[4] || capitalizeFirstLetter(convertHyphensToCamelCase(containerFileNameNoExtension));

    const code = readFile(containerFilePath);
    const queryModelsCode = readFile(queryModelsFilePath);

    const relativeGraphqlFilePath = path.relative(containerFilePath, graphqlFilePath);
    const relativeQueryModelsFilePath = path.relative(containerFilePath, queryModelsFilePath);

    const newCode = addApolloQuery(code, relativeGraphqlFilePath, queryName, relativeQueryModelsFilePath, queryModelsCode, componentName);
    writeFile(containerFilePath, newCode);
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