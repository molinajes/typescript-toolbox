// Taken from https://gist.github.com/youssman/745578062609e8acac9f
export const convertCamelCaseToHyphens = (myStr: string) => {
    return !myStr ? null : myStr.replace(/([A-Z])/g, function (g) {
        return '-' + g[0].toLowerCase()
    });
};

// Taken from https://stackoverflow.com/questions/6660977/convert-hyphens-to-camel-case-camelcase
export const convertHyphensToCamelCase = (myString: string) => {
    return myString.replace(/-([a-z])/g, function (g) {
        return g[1].toUpperCase();
    });

};

// Taken from https://stackoverflow.com/questions/1026069/how-do-i-make-the-first-letter-of-a-string-uppercase-in-javascript
export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export const convertCamelCaseToConstant = (myStr: string) => {
    return !myStr ? null : myStr.replace(/([A-Z])/g, function (g) {
        return '_' + g[0].toUpperCase()
    });
};

// Taken from https://stackoverflow.com/questions/4250364/how-to-trim-a-file-extension-from-a-string-in-javascript
export const removeFileExtension = (pathStr: string): string => pathStr.replace(/\.[^/.]+$/, "");
