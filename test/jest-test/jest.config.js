module.exports = {
  "roots": [
    "<rootDir>/src"
  ],
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  },
  "testRegex": "\\.test\\.ts$",
  "moduleFileExtensions": [
    "ts",
    "js"
  ],
  "reporters": [
    "<rootDir>/node_modules/vqa/dist/to-match-screenshot-reporter.js",
    "default"
  ]
}
