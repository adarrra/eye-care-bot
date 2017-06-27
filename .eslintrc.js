// Rules list http://eslint.org/docs/rules/
// airbnb styleguide https://github.com/airbnb/javascript

const OFF = 0;
const WARN = 1;
const ERR = 2;

module.exports = {
    extends: "airbnb-base",
    env: {
        es6: true,
        commonjs: true,
        node: true,
    },
    rules: {
        indent: ['error', 4, {SwitchCase: 1}],
        'no-console': [OFF],
        camelcase: [OFF],
        'consistent-return': [OFF],
        'no-use-before-define': ["error", { "functions": false, "classes": true }],
        'import/newline-after-import': [OFF],
        'arrow-parens': [OFF]
    }
}    
