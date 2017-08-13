import * as fs from 'fs';
import {task as addActionTask} from './src/tasks/add-action';
import {task as addReducerTask} from './src/tasks/add-reducer';
import {task as addSubReducerTask} from './src/tasks/add-sub-reducer';
import {task as addComponentTask} from './src/tasks/add-component';
import {task as addContainerTask} from './src/tasks/add-container';
import {task as addReduxTask} from './src/tasks/add-redux';

require('colors');
import * as jsdiff from 'diff';
import {promptYesOrNo} from './src/utils/prompt-utils';

const tasks: TsToolboxTask[] = [addActionTask, addReducerTask, addSubReducerTask, addComponentTask, addContainerTask,
    addReduxTask];

const command = process.argv[2];
const task = tasks.find(t => t.command === command);

if (!task) {
    console.log(`No tasks for specified command '${command}' found.`);
    console.log(`The following commands are available: `);
    tasks.forEach(t => console.log(t.command));
    process.exit();
}

const taskArgs = process.argv.slice(3);

// Validate task arguments
const numberOfRequiredArguments = task.argumentInfo.filter(i => i.required).length;
const numberOfArguments = task.argumentInfo.length;
if (numberOfRequiredArguments > taskArgs.length ||
    numberOfArguments < taskArgs.length) {
    console.log(`Wrong number of arguments.`);
    console.log(`The command '${command}' expects the following arguments: `);
    task.argumentInfo.forEach(i => console.log(`${i.description} [${i.required ? 'required' : 'optional'}]`));
    process.exit();
}

let writeActions: { [filePath: string]: string } = {};

const readFile = (filePath: string) => {
    const fileExists = fs.existsSync(filePath);
    return fileExists ? fs.readFileSync(filePath, 'utf8') : '';
};

const writeFile = (filePath: string, content: string) => {
    writeActions[filePath] = content;
};

task.execute(taskArgs, readFile, writeFile);

// TODO: Get user confirmation
Object.keys(writeActions).forEach(filePath => {
    const oldCode = readFile(filePath);
    const newCode = writeActions[filePath];
    const diff = jsdiff.diffLines(oldCode, newCode);

    console.log(`The following changes will be applied to ${filePath}:`);

    diff.forEach(function (part) {
        if (!part.added && !part.removed) {
            return;
        }

        const outPutPrefix = part.added ? '+ ' : part.removed ? '- ' : '';

        // green for additions, red for deletions
        // grey for common parts
        const color = part.added ? 'green' :
            part.removed ? 'red' : 'grey';
        const outputText = outPutPrefix + part.value;
        console.log(outputText[color]);
    });
    console.log()
});

promptYesOrNo('Do you want to apply these changes?', result => {
    if (!result) {
        console.log('Change are not applied.');
        return;
    }
    console.log('Applying changes..');

    // Write files
    Object.keys(writeActions).forEach(filePath => {
        console.log(filePath);
        fs.writeFileSync(filePath, writeActions[filePath], 'utf8');
        console.log('OK ✔');
    });
});
