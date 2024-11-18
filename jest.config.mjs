/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
    testEnvironment: "node",
    transform: {
        "^.+.tsx?$": [
            "ts-jest",
            {
                tsconfig: "tsconfig.test.json",
            },
        ],
    },
    testRegex: "/tests/.*\\.(test|spec)?\\.(ts|tsx)$",
    collectCoverage: true,
    coverageReporters: ["html"],
};
