import { WebDriver } from 'selenium-webdriver';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import * as fs from 'fs';
import * as crypto from 'crypto';
import stringify from 'json-stable-stringify';
import 'jest';

interface GenericObject<V> {
  [key: string]: V
}

type PersistedJson = GenericObject<GenericObject<string>>;

export async function toMatchScreenshot(driver: WebDriver, assertionName: string): Promise<jest.CustomMatcherResult> {
  // @ts-ignore
  const dirname = path.dirname(this.testPath);
  // @ts-ignore
  const currentTestName = this.currentTestName;
  const screenshotsDir = makeSureDirExists(path.join(dirname, '__screenshots__'));
  const capabilities = await driver.getCapabilities();
  const browserName: string = capabilities.get('browserName');
  const screenshotsPathForBrowser = path.join(screenshotsDir, `${browserName}.json`);
  let persistedJson: PersistedJson = readJsonFile(screenshotsPathForBrowser, {});

  // @ts-ignore
  const screenshotBuffer = await takeScreenshot(driver, screenshotsDir);
  const screenshotHash = createSha512Hash(screenshotBuffer);
  const pass = hashSameAsBefore(persistedJson, currentTestName, assertionName, screenshotHash);

  saveScreenshot(screenshotBuffer, screenshotHash, screenshotsDir);

  if (pass) {
    writeJsonFile(screenshotsPathForBrowser, persistedJson);
    return {
      message: () => `Screenshot for ${assertionName} is okay.`,
      pass,
    };
  } else {
    return {
      message: () => JSON.stringify({
        message: `Hash for screenshot ${assertionName} does not match.`,
        expected: persistedJson[currentTestName][assertionName],
        actual: screenshotHash,
      }, null, 2),
      pass,
    };
  }
}

function hashSameAsBefore(persistedJson: PersistedJson, testName: string, assertionName: string, hash: string): boolean {
  if (!persistedJson.hasOwnProperty(testName)) {
    persistedJson[testName] = {};
  }

  if (!persistedJson[testName].hasOwnProperty(assertionName)) {
    persistedJson[testName][assertionName] = hash;
    return true;
  }

  return persistedJson[testName][assertionName] === hash;
}

function saveScreenshot(imageBuffer: Buffer, hash: string, screenshotsDir: string): void {
  const screenshotPath = path.join(screenshotsDir, `${hash}.png`);
  if (!fs.existsSync(screenshotPath)) {
    fs.writeFileSync(screenshotPath, imageBuffer);
  }
}

async function takeScreenshot(driver: WebDriver, screenshotsDir: string): Promise<Buffer> {
  const image = await driver.takeScreenshot();
  return Buffer.from(image, 'base64');
}

function makeSureDirExists(path: string): string {
  mkdirp.sync(path);
  return path;
}

function writeJsonFile(path: string, value: object): void {
  fs.writeFileSync(path, stringify(value, { space: 2 }));
}

function readJsonFile<T>(path: string, defaultValue: T): T {
  try {
    const recordsFile = fs.readFileSync(path);
    return JSON.parse(recordsFile.toString('ascii'));
  } catch (e) {
    return defaultValue;
  }
}

function createSha512Hash(content: Buffer): string {
  return crypto.createHash('sha512').update(content).digest('hex')
}