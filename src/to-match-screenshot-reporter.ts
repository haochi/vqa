import * as path from 'path';
import 'jest';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import { TestResult, AsssertionResult, ErrorMessageObject } from './to-match-screenshot-reporter-types';

class ToMatchScreenshotReporter implements jest.Reporter {
  constructor(private globalConfig: jest.GlobalConfig, private options: any) {
  }

  onRunComplete(contexts: Set<jest.Context>, results: jest.AggregatedResult) {
    const tests: TestResult[] = [];

    results.testResults.forEach((testResult) => {
      const testFileDir = path.dirname( testResult.testFilePath );
      const screenshotDir = path.join( testFileDir, '__screenshots__' );
      const tResult: TestResult = {
        testFilePath: testResult.testFilePath,
        screenshotDir,
        assertionResults: [],
      };
      tests.push(tResult);

      testResult.testResults.forEach((assertionResult) => {
        const aResult: AsssertionResult = {
          fullName: assertionResult.fullName,
          status: assertionResult.status,
        };
        tResult.assertionResults.push(aResult);

        if (assertionResult.status === 'failed') {
          assertionResult.failureMessages.forEach( failureMessage => {
            aResult.errorMessageObject = getErrorObject(failureMessage);
          });
        }
      });
    });

    console.log('Generated report at', this.generateHtmlReport(tests));
    console.log('Please view it from a web server.');
  }

  private generateHtmlReport( testResults: TestResult[] ): string {
    const content = fs.readFileSync(path.join(__dirname, 'to-match-screenshot-report-viewer.js')).toString();
    const results = JSON.stringify(testResults);
    fs.copyFileSync
    const html = `
    <script>module = {}; exports = {}</script>
    <script src="https://cdn.jsdelivr.net/npm/pixelmatch@4.0.2/index.min.js"></script>
    <script>${content}</script>
    <script>document.addEventListener('DOMContentLoaded', function() {
      main(${results});
    });</script>`;
    const reportDir = path.join( this.globalConfig.rootDir, 'to-match-screenshot-report');
    mkdirp.sync(reportDir);
    copyScreenshotsToReportDir( reportDir, testResults );
    const reportPath = path.join( reportDir, 'index.html');
    fs.writeFileSync(reportPath, html);
    return reportPath;
  }
}

function copyScreenshotsToReportDir( reportDir: string, testResults: TestResult[] ): void {
  testResults.forEach( testResult => {
    testResult.assertionResults.forEach( assertionResult => {
      if ( assertionResult.status == 'failed' && assertionResult.errorMessageObject ) {
        fs.copyFileSync( path.join(testResult.screenshotDir, `${assertionResult.errorMessageObject.actual}.png` ), path.join( reportDir, `${assertionResult.errorMessageObject.actual}.png`) );
        fs.copyFileSync( path.join(testResult.screenshotDir, `${assertionResult.errorMessageObject.expected}.png` ), path.join( reportDir, `${assertionResult.errorMessageObject.expected}.png` ) );
      }
    })
  });
}

function getErrorObject( errorMessage: string ): ErrorMessageObject | undefined {
  try {
    return JSON.parse(errorMessage.slice(errorMessage.indexOf('{')));
  } catch {
    return undefined;
  }
}

export = ToMatchScreenshotReporter;