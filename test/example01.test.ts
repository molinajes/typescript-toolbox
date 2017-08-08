import {addAction} from '../src/tasks/add-action';

const code = 'export interface Action01 {\n' +
    '    type: typeof ActionTypes.ACTION_01;\n' +
    '}' +
    '\n' +
    'export type Action = Action01;' +
    '\n' +
    'const ACTION_01 = "ACTION_01";' +
    '\n' +
    'export const ActionTypes = {\n' +
    '    ACTION_01: <typeof ACTION_01> ACTION_01\n' +
    '};\n' +
    'export const createAction01 = (): Action01 => {\n' +
    '    return {\n' +
    '        type: ActionTypes.ACTION_01\n' +
    '    };\n' +
    '};\n';

const expectedResult = 'export interface Action01 {\n' +
    '    type: typeof ActionTypes.ACTION_01;\n' +
    '}\n' +
    'const ACTION_01 = "ACTION_01";\n' +
    'export const createAction01 = (): Action01 => {\n' +
    '    return {\n' +
    '        type: ActionTypes.ACTION_01\n' +
    '    };\n' +
    '};\n' +
    'export const SOME_QUALIFIED_PREFIX_ActionTestName = "SOME_QUALIFIED_PREFIX_ActionTestName";\n' +
    'interface ActionTestName {\n' +
    '    readonly type: typeof ActionTypes.ActionTestName;\n' +
    '}\n' +
    'export const createActionTestName = (): ActionTestName => {\n' +
    '    return { type: ActionTypes.ActionTestName };\n' +
    '};\n' +
    'export type Action = Action01 | ActionTestName;\n' +
    'export const ActionTypes = {\n' +
    '    ACTION_01: <typeof ACTION_01>ACTION_01,\n' +
    '    ActionTestName: (<typeof SOME_QUALIFIED_PREFIX_ActionTestName>SOME_QUALIFIED_PREFIX_ActionTestName)\n' +
    '};\n';

test('AddAction', () => {
    const modifiedCode = addAction(code);
    expect(modifiedCode).toEqual(expectedResult);
});
