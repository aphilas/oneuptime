const puppeteer = require('puppeteer');
const utils = require('../../test-utils');
const init = require('../../test-init');

require('should');

let browser, page;
// user credentials
const email = utils.generateRandomBusinessEmail();
const password = '1234567890';
const componentName = utils.generateRandomString();
const monitorName = utils.generateRandomString();
const countryCode = '+1';
const phoneNumber = '9173976235';
const subscriberEmail = utils.generateRandomBusinessEmail();

describe('Subscribers Alert logs API', () => {
    const operationTimeOut = init.timeout;

    beforeAll(async () => {
        jest.setTimeout(init.timeout);

        browser = await puppeteer.launch(utils.puppeteerLaunchConfig);
        page = await browser.newPage();
        await page.setUserAgent(utils.agent);

        const user = {
            email,
            password,
        };
        await init.registerUser(user, page);

        await init.addSmtpSettings(
            utils.smtpCredential.user,
            utils.smtpCredential.pass,
            utils.smtpCredential.host,
            utils.smtpCredential.port,
            utils.smtpCredential.from,
            utils.smtpCredential.secure,
            page
        );
        await init.addTwilioSettings(
            true,
            utils.twilioCredentials.accountSid,
            utils.twilioCredentials.authToken,
            utils.twilioCredentials.phoneNumber,
            page
        );
        await init.addMonitorToComponent(componentName, monitorName, page);
    });

    afterAll(async done => {
        await browser.close();
        done();
    });

    test(
        'Should add SMS subscribers.',
        async done => {
            await page.goto(utils.DASHBOARD_URL, {
                waitUntil: 'networkidle0',
            });
            await init.navigateToMonitorDetails(
                componentName,
                monitorName,
                page
            );
            await init.gotoTab(utils.monitorTabIndexes.SUBSCRIBERS, page);
            await page.waitForSelector('#addSubscriberButton');
            await init.pageClick(page, '#addSubscriberButton');
            await page.waitForSelector('#alertViaId');
            await init.selectByText('#alertViaId', 'sms', page);
            await page.waitForSelector('#countryCodeId');
            await init.selectByText('#countryCodeId', countryCode, page);
            await init.pageType(page, '#contactPhoneId', phoneNumber);
            await init.pageClick(page, '#createSubscriber');
            await page.waitForSelector('#createSubscriber', {
                hidden: true,
            });
            const subscriberPhoneNumberSelector =
                '#subscribersList tbody tr:first-of-type td:nth-of-type(4)';
            await page.waitForSelector(subscriberPhoneNumberSelector);
            const subscriberPhoneNumber = await page.$eval(
                subscriberPhoneNumberSelector,
                e => e.textContent
            );
            expect(subscriberPhoneNumber).toEqual(
                `${countryCode}${phoneNumber}`
            );
            done();
        },
        operationTimeOut
    );

    test(
        'Should add Email subscribers.',
        async done => {
            await page.goto(utils.DASHBOARD_URL, {
                waitUntil: 'networkidle0',
            });
            await init.navigateToMonitorDetails(
                componentName,
                monitorName,
                page
            );
            await init.gotoTab(utils.monitorTabIndexes.SUBSCRIBERS, page);
            await page.waitForSelector('#addSubscriberButton');
            await init.pageClick(page, '#addSubscriberButton');
            await page.waitForSelector('#alertViaId');
            await init.selectByText('#alertViaId', 'email', page);
            await page.waitForSelector('#emailId');
            await init.pageType(page, '#emailId', subscriberEmail);
            await init.pageClick(page, '#createSubscriber');
            await page.waitForSelector('#createSubscriber', {
                hidden: true,
            });
            await page.reload({ waitUntil: 'networkidle0' });
            await init.gotoTab(utils.monitorTabIndexes.SUBSCRIBERS, page);
            const subscriberEmailSelector =
                '#subscribersList tbody tr:first-of-type td:nth-of-type(4)';
            await page.waitForSelector(subscriberEmailSelector);
            const renderedSubscriberEmail = await page.$eval(
                subscriberEmailSelector,
                e => e.textContent
            );
            expect(renderedSubscriberEmail).toEqual(subscriberEmail);
            done();
        },
        operationTimeOut
    );

    test(
        'Should send SMS and Email when an incident is created.',
        async done => {
            await init.navigateToMonitorDetails(
                componentName,
                monitorName,
                page
            );

            await page.waitForSelector(`#monitorCreateIncident_${monitorName}`);
            await init.pageClick(page, `#monitorCreateIncident_${monitorName}`);
            await page.waitForSelector('#incidentType');
            await init.selectByText('#incidentType', 'offline', page);
            await init.pageClick(page, '#createIncident');
            await page.waitForSelector(`#incident_${monitorName}_0`);
            await page.waitForSelector('#notificationscroll');
            await init.pageClick(page, '#viewIncident-0');
            await page.waitForSelector('#incident_0');

            await page.reload({ waitUntil: 'networkidle0' });
            await init.gotoTab(utils.incidentTabIndexes.ALERT_LOGS, page);
            await page.waitForSelector('#subscriberAlertTable tbody tr');
            const rowsCount = (await page.$$('#subscriberAlertTable tbody tr'))
                .length;
            expect(rowsCount).toEqual(2);

            const firstRowIdentifier =
                '#subscriberAlertTable tbody tr:nth-of-type(1)';
            await init.pageClick(page, firstRowIdentifier);
            await page.waitForSelector('#backboneModals .bs-Modal-content');

            const subscriber = await page.$eval(
                '#backboneModals #subscriber',
                e => e.textContent
            );
            const via = await page.$eval(
                '#backboneModals #alertVia',
                e => e.textContent
            );
            const type = await page.$eval(
                '#backboneModals #eventType',
                e => e.textContent
            );
            const alertStatus = await page.$eval(
                '#backboneModals #alertStatus',
                e => e.textContent
            );

            expect([subscriberEmail, `${countryCode}${phoneNumber}`]).toContain(
                subscriber
            );

            expect(['sms', 'email']).toContain(via);
            expect(type).toEqual('identified');
            expect(alertStatus).toEqual('Sent');

            await init.pageClick(page, '#backboneModals #closeBtn');
            await page.waitForSelector('#backboneModals .bs-Modal-content', {
                hidden: true,
            });

            const secondRowIdentifier =
                '#subscriberAlertTable tbody tr:nth-of-type(2)';
            await init.pageClick(page, secondRowIdentifier);
            await page.waitForSelector('#backboneModals .bs-Modal-content');

            const subscriber1 = await page.$eval(
                '#backboneModals #subscriber',
                e => e.textContent
            );
            const via1 = await page.$eval(
                '#backboneModals #alertVia',
                e => e.textContent
            );
            const type1 = await page.$eval(
                '#backboneModals #eventType',
                e => e.textContent
            );
            const alertStatus1 = await page.$eval(
                '#backboneModals #alertStatus',
                e => e.textContent
            );

            expect([subscriberEmail, `${countryCode}${phoneNumber}`]).toContain(
                subscriber1
            );
            expect(['sms', 'email']).toContain(via1);
            expect(type1).toEqual('identified');
            expect(alertStatus1).toEqual('Sent');
            done();
        },
        operationTimeOut
    );
});