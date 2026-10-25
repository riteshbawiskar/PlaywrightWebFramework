import { Then } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world';

Then('the message {string} should be displayed', async function (this: CustomWorld, expectedMessage: string) {
  await this.loginPage.waitForToast(expectedMessage);
});
