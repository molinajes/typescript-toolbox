import {addComponent} from '../../src/tasks/add-component';

const expectedResult = 'import * as React from "react";\n' +
    'import { StatelessComponent } from "react";\n' +
    'export interface Props {\n' +
    '}\n' +
    'export const MyComponent: StatelessComponent<Props> = (props: Props) => {\n' +
    '    return <div />;\n' +
    '};\n';

test('AddComponent of type "stateless"', () => {
    const modifiedCode = addComponent('./my-component', 'MyComponent', 'stateless');
    expect(modifiedCode).toEqual(expectedResult);
});
