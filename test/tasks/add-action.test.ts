import {addAction} from '../../src/tasks/add-action';

test('AddAction no existing actions', () => {
    const newActionName = 'NewAction';
    const actionTypeConstant = 'NEW_ACTION';
    const expectedCode = 'export const NEW_ACTION = "NEW_ACTION";\n' +
        'interface NewAction {\n' +
        '    readonly type: typeof ActionTypes.NEW_ACTION;\n' +
        '}\n' +
        'export const createNewAction = (): NewAction => {\n' +
        '    return { type: ActionTypes.NewAction };\n' +
        '};\n' +
        'export type Action = NewAction;\n' +
        'const ActionTypes = { NewAction: (<typeof NEW_ACTION>NEW_ACTION) };\n';

    const modifiedCode = addAction('', newActionName, actionTypeConstant);
    expect(modifiedCode).toEqual(expectedCode);
});

test('AddAction', () => {
    const newActionName = 'NewAction';
    const actionTypeConstant = 'NEW_ACTION';
    const code = 'export const EXISTING_ACTION = "EXISTING_ACTION";\n' +
        'interface ExistingAction {\n' +
        '    readonly type: typeof ActionTypes.EXISTING_ACTION;\n' +
        '}\n' +
        'export const createExistingAction = (): ExistingAction => {\n' +
        '    return { type: ActionTypes.ExistingAction };\n' +
        '};\n' +
        'export type Action = ExistingAction;\n' +
        'const ActionTypes = { ExistingAction: (<typeof EXISTING_ACTION>EXISTING_ACTION) }';
    const expectedCode = 'export const EXISTING_ACTION = "EXISTING_ACTION";\n' +
        'interface ExistingAction {\n' +
        '    readonly type: typeof ActionTypes.EXISTING_ACTION;\n' +
        '}\n' +
        'export const createExistingAction = (): ExistingAction => {\n' +
        '    return { type: ActionTypes.ExistingAction };\n' +
        '};\n' +
        'export const NEW_ACTION = "NEW_ACTION";\n' +
        'interface NewAction {\n' +
        '    readonly type: typeof ActionTypes.NEW_ACTION;\n' +
        '}\n' +
        'export const createNewAction = (): NewAction => {\n' +
        '    return { type: ActionTypes.NewAction };\n' +
        '};\n' +
        'export type Action = ExistingAction | NewAction;\n' +
        'const ActionTypes = { ExistingAction: (<typeof EXISTING_ACTION>EXISTING_ACTION), NewAction: (<typeof NEW_ACTION>NEW_ACTION) };\n';

    const modifiedCode = addAction(code, newActionName, actionTypeConstant);
    expect(modifiedCode).toEqual(expectedCode);
});

