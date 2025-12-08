import type { Config } from "jest";

const config: Config = {
  rootDir: __dirname,
  moduleFileExtensions: ["js", "json", "ts"],
  testRegex: ".e2e-spec.ts$",
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
  collectCoverageFrom: [],
  testEnvironment: "node",
  globalSetup: "<rootDir>/test/jest-global-setup.ts",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

export default config;
