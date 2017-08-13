import * as ts from 'typescript';
import {Modifier, NodeFlags, Statement, SyntaxKind, TypeElement, TypeNode} from 'typescript';

export interface Import {
    readonly element: string;
    readonly alias?: string;
}

export const createImport = (imports: Import[], fromPath: string): Statement => {
    const importSpecifiers =
        imports.map(i => {
            if (i.alias) {
                return ts.createImportSpecifier(
                    ts.createIdentifier(i.element),
                    ts.createIdentifier(i.alias)
                )
            }

            return ts.createImportSpecifier(
                undefined,
                ts.createIdentifier(i.element)
            )
        });

    return ts.createImportDeclaration(
        [],
        [],
        ts.createImportClause(undefined, ts.createNamedImports(importSpecifiers)),
        ts.createLiteral(fromPath));
};

export const createEmptyInterface = (interfaceName: string) => {
    return ts.createInterfaceDeclaration(
        undefined,
        [ts.createToken(SyntaxKind.ExportKeyword)],
        interfaceName,
        undefined,
        undefined,
        []);
};

export interface InterfaceMembers {
    readonly name: string;
    readonly type: TypeNode | string;
    readonly optional?: boolean;
}

export const createInterface = (interfaceName: string, properties: InterfaceMembers[]) => {
    const propModifiers: Modifier[] = [
        ts.createToken(SyntaxKind.ReadonlyKeyword)
    ];
    const members = properties.map(p => {
            const type = p.type instanceof String ? ts.createTypeReferenceNode(ts.createIdentifier(p.type), []) : p.type;
            return ts.createPropertySignature(
                propModifiers,
                p.name,
                p.optional === true ? ts.createToken(SyntaxKind.QuestionToken) : undefined,
                type,
                undefined
            );
        }
    );

    return ts.createInterfaceDeclaration(
        undefined,
        undefined,
        interfaceName,
        undefined,
        undefined,
        members);
};

export interface UnionTypeEntry {
    readonly type: string;
}

export const createUnionTypeDeclaration = (name: string, types: UnionTypeEntry[]) => {
    const unionTypes = types.map(t => ts.createTypeReferenceNode(t.type, []));
    return ts.createTypeAliasDeclaration([],
        [ts.createToken(SyntaxKind.ExportKeyword)],
        name,
        [],
        ts.createUnionTypeNode(unionTypes));
};

export const createIntersectionTypeDeclaration = (name: string, types: UnionTypeEntry[]) => {
    const unionTypes = types.map(t => ts.createTypeReferenceNode(t.type, []));
    return ts.createTypeAliasDeclaration([],
        [ts.createToken(SyntaxKind.ExportKeyword)],
        name,
        [],
        ts.createIntersectionTypeNode(unionTypes));
};

export interface FunctionParameter {
    readonly name: string;
    readonly type: string;
}

export const createArrowFunction = (name: string, parameters: FunctionParameter[], returnType?: string) => {
    const functionParameters =
        parameters.map(p =>
            ts.createParameter(
                [],
                [],
                undefined,
                p.name,
                undefined,
                ts.createTypeReferenceNode(p.type, [])));

    const stmtReturn = ts.createReturn(ts.createObjectLiteral());

    const expr = ts.createArrowFunction(
        [],
        [],
        functionParameters,
        ts.createTypeReferenceNode(returnType, []),
        ts.createToken(SyntaxKind.EqualsGreaterThanToken),
        ts.createBlock([stmtReturn], true));
    const declaration = ts.createVariableDeclaration(name, undefined, expr);
    return ts.createVariableStatement(
        [ts.createToken(SyntaxKind.ExportKeyword)],
        ts.createVariableDeclarationList([declaration], NodeFlags.Const)
    );
};