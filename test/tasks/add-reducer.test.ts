import {addReducer} from '../../src/tasks/add-reducer';

const expectedResult = 'import { Action } from "../actions";\n' +
    'export interface State {\n' +
    '}\n' +
    'export const defaultState = {};\n' +
    'export const reducer = (state: State, action: Action): State => {\n' +
    '    return state;\n' +
    '};\n';

test('AddReducer', () => {
    const modifiedCode = addReducer('../actions');
    expect(modifiedCode).toEqual(expectedResult);
});
