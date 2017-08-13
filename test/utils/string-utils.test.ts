import {
    convertCamelCaseToConstant, convertCamelCaseToHyphens,
    convertHyphensToCamelCase, removeFileExtension
} from '../../src/utils/string-utils';

test('convertCamelCaseToHyphens', () => {
    const result = convertCamelCaseToHyphens('MyCamelCaseString');
    expect(result).toBe('my-camel-case-string');
});

test('convertHyphensToCamelCase', () => {
    const result = convertHyphensToCamelCase('my-camel-case-string');
    expect(result).toBe('myCamelCaseString');
});

test('capitalizeFirstLetter', () => {
    const result = convertCamelCaseToConstant('MyCamelCaseString');
    expect(result).toBe('MY_CAMEL_CASE_STRING');
});

test('removeFileExtension', () => {
    const result = removeFileExtension('my-file.ext');
    expect(result).toBe('my-file');
});

test('removeFileExtension no extension', () => {
    const result = removeFileExtension('my-file');
    expect(result).toBe('my-file');
});