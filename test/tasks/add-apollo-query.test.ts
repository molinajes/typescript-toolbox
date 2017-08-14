import {addApolloQuery} from '../../src/tasks/add-apollo-query';

test('addApolloQuery', () => {
    const containerCode = 'import { MyComponent as MyComponentComponent } from "./my-component-component";\n' +
        'import { connect, Disptach } from "react-redux";\n' +
        'interface Props {\n' +
        '    readonly myProp: string;\n' +
        '}\n' +
        'export interface ReduxStateProps {\n' +
        '}\n' +
        'export interface ReduxDispatchProps {\n' +
        '}\n' +
        'export type AllProps = Props & ReduxStateProps & ReduxDispatchProps;\n' +
        'export const mapStateToProps = (): ReduxStateProps => {\n' +
        '    return {};\n' +
        '};\n' +
        'export const mapDispatchToProps = (): ReduxDispatchProps => {\n' +
        '    return {};\n' +
        '};\n' +
        'export const withRedux = connect<ReduxStateProps, ReduxDispatchProps, Props>(mapStateToProps, mapDispatchToProps);\n' +
        'export const MyComponent = withRedux(MyComponentComponent);\n';

    const queryModelsCode = '\n' +
        'export type DataQueryVariables = {\n' +
        '  id: string,\n' +
        '};\n' +
        '\n' +
        'export type DataQuery = {\n' +
        '  element:  {\n' +
        '    id: string\n' +
        '  } | null\n' +
        '};';
    const expectedResult = 'import { MyComponent as MyComponentComponent } from "./my-component-component";\n' +
        'import { connect, Disptach } from "react-redux";\n' +
        'import { graphql, DefaultChildProps } from "react-apollo";\n' +
        'import * as dataQuery from "./query/data-query.graphql";\n' +
        'import { DataQuery, DataQueryVariables } from "./query/data-query-models.ts";\n' +
        'interface Props {\n' +
        '    readonly myProp: string;\n' +
        '}\n' +
        'export interface ReduxStateProps {\n' +
        '}\n' +
        'export interface ReduxDispatchProps {\n' +
        '}\n' +
        'export type DataQueryDataProp = DefaultChildProps<Props, DataQuery>;\n' +
        'export type ApolloProps = DataQueryDataProp;\n' +
        'export type AllProps = Props & ReduxStateProps & ReduxDispatchProps & ApolloProps;\n' +
        'export const mapStateToProps = (): ReduxStateProps => {\n' +
        '    return {};\n' +
        '};\n' +
        'export const mapDispatchToProps = (): ReduxDispatchProps => {\n' +
        '    return {};\n' +
        '};\n' +
        'export const withRedux = connect<ReduxStateProps, ReduxDispatchProps, Props>(mapStateToProps, mapDispatchToProps);\n' +
        'export const withApollo = graphql(dataQuery);\n' +
        'export const MyComponent = withApollo(withRedux(MyComponentComponent));\n';

    const modifiedCode = addApolloQuery(containerCode, './query/data-query.graphql', 'dataQuery', './query/data-query-models.ts', queryModelsCode, 'MyComponent');
    expect(modifiedCode).toEqual(expectedResult);
});

test('addApolloQuery to container with apollo query', () => {
    const containerCode = 'import { MyComponent as MyComponentComponent } from "./my-component-component";\n' +
        'import { connect, Disptach } from "react-redux";\n' +
        'import { graphql, DefaultChildProps } from "react-apollo";\n' +
        'import * as dataQuery from "./query/data-query.graphql";\n' +
        'import { DataQuery, DataQueryVariables } from "./query/data-query-models.ts";\n' +
        'export interface ReduxStateProps {\n' +
        '}\n' +
        'export interface ReduxDispatchProps {\n' +
        '}\n' +
        'export type DataQueryDataProp = DefaultChildProps<Props, DataQuery>;\n' +
        'export type ApolloProps = DataQueryDataProp;\n' +
        'export type AllProps = Props & ReduxStateProps & ReduxDispatchProps & ApolloProps;\n' +
        'export const mapStateToProps = (): ReduxStateProps => {\n' +
        '    return {};\n' +
        '};\n' +
        'export const mapDispatchToProps = (): ReduxDispatchProps => {\n' +
        '    return {};\n' +
        '};\n' +
        'export const withRedux = connect<ReduxStateProps, ReduxDispatchProps, Props>(mapStateToProps, mapDispatchToProps);\n' +
        'export const withApollo = graphql(dataQuery);\n' +
        'export const MyComponent = withApollo(withRedux(MyComponentComponent));\n';

    const queryModelsCode = '\n' +
        'export type OtherDataQueryVariables = {\n' +
        '  id: string,\n' +
        '};\n' +
        '\n' +
        'export type OtherDataQuery = {\n' +
        '  element:  {\n' +
        '    id: string\n' +
        '  } | null\n' +
        '};';
    const expectedResult = 'import { MyComponent as MyComponentComponent } from "./my-component-component";\n' +
        'import { connect, Disptach } from "react-redux";\n' +
        'import { graphql, DefaultChildProps } from "react-apollo";\n' +
        'import * as dataQuery from "./query/data-query.graphql";\n' +
        'import { DataQuery, DataQueryVariables } from "./query/data-query-models.ts";\n' +
        'import * as otherDataQuery from "./query/other-data-query.graphql";\n' +
        'import { OtherDataQuery, OtherDataQueryVariables } from "./query/other-data-query-models.ts";\n' +
        'import { compose } from "redux";\n' +
        'export interface ReduxStateProps {\n' +
        '}\n' +
        'export interface ReduxDispatchProps {\n' +
        '}\n' +
        'export type DataQueryDataProp = DefaultChildProps<Props, DataQuery>;\n' +
        'export type OtherDataQueryDataProp = DefaultChildProps<Props, OtherDataQuery>;\n' +
        'export type ApolloProps = DataQueryDataProp & OtherDataQueryDataProp;\n' +
        'export type AllProps = Props & ReduxStateProps & ReduxDispatchProps & ApolloProps;\n' +
        'export const mapStateToProps = (): ReduxStateProps => {\n' +
        '    return {};\n' +
        '};\n' +
        'export const mapDispatchToProps = (): ReduxDispatchProps => {\n' +
        '    return {};\n' +
        '};\n' +
        'export const withRedux = connect<ReduxStateProps, ReduxDispatchProps, Props>(mapStateToProps, mapDispatchToProps);\n' +
        'export const withApollo = compose(graphql(dataQuery), graphql(otherDataQuery));\n' +
        'export const MyComponent = withApollo(withRedux(MyComponentComponent));\n';

    const modifiedCode = addApolloQuery(containerCode, './query/other-data-query.graphql', 'otherDataQuery', './query/other-data-query-models.ts', queryModelsCode, 'MyComponent');
    expect(modifiedCode).toEqual(expectedResult);
});