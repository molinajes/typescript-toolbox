import {task as addActionTask} from './src/tasks/add-action';
import {task as addReducerTask} from './src/tasks/add-reducer';
import {task as addSubReducerTask} from './src/tasks/add-sub-reducer';

const tasks: TsToolBeltTask[] = [addActionTask, addReducerTask, addSubReducerTask];

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

task.execute(taskArgs);