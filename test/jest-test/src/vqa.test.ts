import { Builder, WebDriver, until, By } from 'selenium-webdriver';
import { toMatchScreenshot } from 'vqa';

expect.extend({
  toMatchScreenshot,
});

describe('vqa', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await new Builder().forBrowser('firefox').build();
  });

  afterAll(async () => {
    await driver.close();
  });

  it('should work', async () => {
    await driver.get('http://localhost:8000/hello-world.html');
    const element = await driver.findElement(By.css('body'))
    await driver.wait(until.elementTextContains(element, 'hello world'))
    // @ts-ignore
    await expect(driver).toMatchScreenshot('hello-world');
  });
});
