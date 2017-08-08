import * as path from 'path';
import * as ts from 'typescript';
import {
    Identifier,
    Modifier, NodeArray, NodeFlags, ObjectLiteralExpression, Statement, SyntaxKind, TypeAliasDeclaration, TypeElement,
    TypeNode,
    UnionTypeNode,
    VariableStatement
} from 'typescript';

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
        [ts.createToken(SyntaxKind.ExportKeyword)],
        ts.createVariableDeclarationList([declaration], NodeFlags.Const)
    );
    return stmActionCreator;
};

const createActionTypeConstants = (name: string) => {
    const expr = ts.createLiteral(name)
    const declaration = ts.createVariableDeclaration(name, undefined, expr);
    const stmConstant = ts.createVariableStatement(
        [ts.createToken(SyntaxKind.ExportKeyword)],
        ts.createVariableDeclarationList([declaration], NodeFlags.Const)
    );
    return stmConstant;
};

const createOrUpdateActionUnionTypeDeclaration = (name: string, oldStmt?: Statement) => {
    const stmt = !!oldStmt ? oldStmt : ts.createTypeAliasDeclaration([],
        [ts.createToken(SyntaxKind.ExportKeyword)],
        'Action',
        [],
        ts.createUnionTypeNode([]));

    if (stmt.kind === SyntaxKind.TypeAliasDeclaration) {
        const typeAliasDeclaration = <TypeAliasDeclaration> stmt;
        const type = typeAliasDeclaration.type;

        let unionTypes: NodeArray<TypeNode> = ts.createNodeArray();

        if (type.kind === SyntaxKind.UnionType) {
            const unionType = (<UnionTypeNode> type);
            unionTypes = unionType.types;
        } else if (type.kind === SyntaxKind.TypeReference) {
            unionTypes.push(type);
        }
        unionTypes.push(ts.createTypeReferenceNode(name, []));

        const updatedUnionType = ts.createUnionTypeNode(unionTypes);
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

const createOrUpdateActionTypesAssignment = (name: string, actionTypeConstantName: string, oldStmt?: Statement) => {
    const declaration = ts.createVariableDeclaration('ActionTypes', undefined, ts.createObjectLiteral());
    const stmt = !!oldStmt ?
        oldStmt
        : ts.createVariableStatement([], ts.createVariableDeclarationList([declaration], NodeFlags.Const));

    if (stmt.kind === SyntaxKind.VariableStatement) {
        const variableStatement = <VariableStatement> stmt;
        const variableDeclaration = variableStatement.declarationList.declarations[0];
        if (variableDeclaration && variableDeclaration.initializer &&
            variableDeclaration.initializer.kind === SyntaxKind.ObjectLiteralExpression) {
            const objectLiteralExpr = <ObjectLiteralExpression> variableDeclaration.initializer;
            const properties = objectLiteralExpr.properties;

            const newProperty = ts.createPropertyAssignment(
                name,
                ts.createTypeAssertion(
                    ts.createTypeQueryNode(ts.createIdentifier(actionTypeConstantName)),
                    ts.createIdentifier(actionTypeConstantName)));
            properties.push(newProperty)
        }
    }

    return stmt;
};

export const isActionUnionType = (stmt: Statement): boolean =>
    stmt.kind === SyntaxKind.TypeAliasDeclaration && (<TypeAliasDeclaration> stmt).name.text === 'Action';

export const isActionTypesAssignment = (stmt: Statement): boolean =>
    stmt.kind === SyntaxKind.VariableStatement && (<Identifier>(<VariableStatement> stmt).declarationList.declarations[0].name).text === 'ActionTypes';

export const addAction = (code: string) => {
    const originalSourceFile = ts.createSourceFile("target.ts", code, ts.ScriptTarget.Latest, /*setParentNodes*/ false, ts.ScriptKind.TS);
    const resultFile = ts.createSourceFile(path.join(__dirname, "someFileName.ts"), "", ts.ScriptTarget.Latest, /*setParentNodes*/ false, ts.ScriptKind.TS);

    let newStatements = originalSourceFile.statements
        .filter(stmt => !isActionUnionType(stmt) && !isActionTypesAssignment(stmt));

    const nameNewAction = 'ActionTestName';
    const qualifiedActionType = `SOME_QUALIFIED_PREFIX_${nameNewAction}`;
    newStatements.push(createActionTypeConstants(qualifiedActionType));
    newStatements.push(createInterface(nameNewAction));
    newStatements.push(createActionCreator(nameNewAction));

    const actionUnionTypeDeclaration = originalSourceFile.statements.find(stm => isActionUnionType(stm));
    newStatements.push(createOrUpdateActionUnionTypeDeclaration(nameNewAction, actionUnionTypeDeclaration));

    const actionTypesAssignment = originalSourceFile.statements.find(stm => isActionTypesAssignment(stm));
    newStatements.push(createOrUpdateActionTypesAssignment(nameNewAction, qualifiedActionType, actionTypesAssignment));

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