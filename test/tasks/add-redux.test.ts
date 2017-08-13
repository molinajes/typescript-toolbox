import {addRedux} from '../../src/tasks/add-redux';

test('replacePropsInComponent', () => {
    const containerCode = 'import { MyComponent as MyComponentComponent } from "./my-component-component";\n' +
        'interface Props {\n' +
        '    readonly myProp: string;\n' +
        '}\n' +
        'export type AllProps = Props;\n' +
        'export const MyComponent = MyComponentComponent;\n';

    const expectedResult = 'import { MyComponent as MyComponentComponent } from "./my-component-component";\n' +
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

    const modifiedCode = addRedux(containerCode, 'MyComponent');
    expect(modifiedCode).toEqual(expectedResult);
});