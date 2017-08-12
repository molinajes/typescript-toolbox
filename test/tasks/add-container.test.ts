import {addContainer, replacePropsInComponent} from '../../src/tasks/add-container';

test('replacePropsInComponent', () => {
    const componentCode = 'import * as React from "react";\n' +
        'import { StatelessComponent } from "react";\n' +
        'interface Props {\n' +
        '}\n' +
        'export const MyComponent: StatelessComponent<Props> = (props: Props) => {\n' +
        '    return <div />;\n' +
        '};\n';

    const expectedResult = 'import * as React from "react";\n' +
        'import { StatelessComponent } from "react";\n' +
        'import { AllProps as Props } from "./my-component";\n' +
        'export const MyComponent: StatelessComponent<Props> = (props: Props) => {\n' +
        '    return <div />;\n' +
        '};\n';

    const modifiedCode = replacePropsInComponent(componentCode, 'my-component');
    expect(modifiedCode).toEqual(expectedResult);
});

test('addContainer', () => {
    const componentCode = 'import * as React from "react";\n' +
        'import { StatelessComponent } from "react";\n' +
        'interface Props {\n' +
        '    readonly myProp: string\n' +
        '}\n' +
        'export const MyComponent: StatelessComponent<Props> = (props: Props) => {\n' +
        '    return <div />;\n' +
        '};\n';

    const expectedResult = 'import { MyComponent as MyComponentComponent } from "./my-component-component";\n' +
        'interface Props {\n' +
        '    readonly myProp: string;\n' +
        '}\n' +
        'export type AllProps = Props;\n' +
        'export const MyComponent = MyComponentComponent;\n';

    const modifiedCode = addContainer('my-component', componentCode, 'my-component-component', 'my-component-component',
        'MyComponent');
    expect(modifiedCode).toEqual(expectedResult);
});
