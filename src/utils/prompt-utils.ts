import * as prompt from 'prompt';

export const promptYesOrNo = (question: string, cb: (result: boolean) => void) => {
    prompt.start();

    const property = {
        name: 'yesno',
        message: question + ' ("[y]es" or "[n]o")',
        validator: /y[es]*|n[o]?/,
        warning: 'Must respond yes or no',
        default: 'no'
    };

    prompt.get(property, function (err, result) {
        const resultBool = !!result.yesno && (result.yesno === 'y' || result.yesno === 'yes');
        cb(resultBool);
    });
}