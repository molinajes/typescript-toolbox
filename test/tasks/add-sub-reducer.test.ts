import {addSubReducer} from '../../src/tasks/add-sub-reducer';

const parentReducerCode = 'import { Action } from "../actions";\n' +
    'export interface State {\n' +
    '}\n' +
    'export const defaultState = {};\n' +
    'export const reducer = (state: State, action: Action): State => {\n' +
    '    return state;\n' +
    '};\n';

const expectedResult = 'import { Action } from "../actions";\n' +
    'import { reducer as reducerReducer, defaultState as defaultStateReducer, State as ReducerState } from "../sub-reducer-test/reducer";\n' +
    'export interface State {\n' +
    '    readonly statePropName: ReducerState;\n' +
    '}\n' +
    'export const defaultState = { statePropName: defaultStateReducer };\n' +
    'export const reducer = (state: State, action: Action): State => {\n' +
    '    return state;\n' +
    '};\n';

test('AddReducer', () => {
    const modifiedCode = addSubReducer(parentReducerCode, '../sub-reducer-test/reducer.ts', 'statePropName');
    expect(modifiedCode).toEqual(expectedResult);
});
