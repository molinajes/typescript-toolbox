import {addAction} from '../src/tasks/add-action';

const code = 'export interface Action01 {\n' +
    '    type: typeof ActionTypes.ACTION_01;\n'+
    '}' +
    '\n' +
    'export type Action = Action01;' +
    '\n' +
    'const ACTION_01 = "ACTION_01";' +
    '\n' +
    'export const ActionTypes = {\n' +
    '    ACTION_01: typeof <ACTION_01>ACTION_01\n' +
    '};\n' +
    'export const createAction01 = (): Action01 => {\n' +
    '    return {\n' +
    '        type: ActionTypes.ACTION_01\n' +
    '    };\n' +
    '};\n';

const expectedResult = 'export interface Action01 {\n' +
    '}' +
    '\n' +
    'export interface Action02 {\n' +
    '}' +
    '\n' +
    'export type Action = Action01 | Action02;' +
    '\n' +
    'const ACTION_01 = "ACTION_01";' +
    '\n' +
    'export const ActionTypes = {\n' +
    '    ACTION_01: typeof <ACTION_01>ACTION_01\n' +
    '};\n' +
    'export const createAction01 = (): Action01 => {\n' +
    '    return {};\n' +
    '};\n' +
    'export const createAction02 = (): Action02 => {\n' +
    '    return {};\n' +
    '};\n';

test('AddAction', () => {
    const modifiedCode = addAction(code);
    expect(modifiedCode).toEqual(code);
    
    console.log(modifiedCode);
});
