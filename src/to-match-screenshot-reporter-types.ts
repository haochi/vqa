export interface ErrorMessageObject {
  message: string;
  expected: string;
  actual: string;
}

export interface TestResult {
  testFilePath: string;
  screenshotDir: string;
  assertionResults: AsssertionResult[];
}

export interface AsssertionResult {
  fullName: string;
  status: jest.Status;
  errorMessageObject?: ErrorMessageObject;
}
