const puppeteer = require('puppeteer');
const utils = require('../../test-utils');
const init = require('../../test-init');

require('should');

let browser;
let page;

const email = utils.generateRandomBusinessEmail();
const password = '1234567890';
const user = {
    email,
    password,
};

describe('Registration API', () => {
    beforeAll(async () => {
        jest.setTimeout(15000);
        browser = await puppeteer.launch(utils.puppeteerLaunchConfig);
        page = await browser.newPage();
        await page.setUserAgent(utils.agent);
    });

    afterAll(async () => {
        await browser.close();
    });

    it('User cannot register with invalid email', async () => {
        const invalidEmail = 'invalidEmail';
        await page.goto(utils.ACCOUNTS_URL + '/register', {
            waitUntil: 'networkidle2',
        });
        await page.waitForSelector('#email');
        await init.pageClick(page, 'input[name=email]');
        await init.pageType(page, 'input[name=email]', invalidEmail);
        await init.pageClick(page, 'input[name=name]');
        await init.pageType(page, 'input[name=name]', utils.user.name);
        await init.pageClick(page, 'input[name=companyName]');
        await init.pageType(
            page,
            'input[name=companyName]',
            utils.user.company.name
        );
        await init.pageClick(page, 'input[name=companyPhoneNumber]');
        await init.pageType(
            page,
            'input[name=companyPhoneNumber]',
            utils.user.phone
        );
        await init.pageClick(page, 'input[name=password]');
        await init.pageType(page, 'input[name=password]', user.password);
        await init.pageClick(page, 'input[name=confirmPassword]');
        await init.pageType(page, 'input[name=confirmPassword]', user.password);
        await init.pageClick(page, 'button[type=submit]');

        await page.waitForSelector('#email_error');
        const errorMsg = await page.$eval(
            '#email_error',
            elem => elem.textContent
        );
        expect(errorMsg).toEqual('Email is not valid.');
    }, 160000);

    it('User cannot register with personal email', async () => {
        const personalEmail = 'personalEmail@gmail.com';
        await page.goto(utils.ACCOUNTS_URL + '/register', {
            waitUntil: 'networkidle2',
        });
        await page.waitForSelector('#email');
        await init.pageClick(page, 'input[name=email]');
        await init.pageType(page, 'input[name=email]', personalEmail);
        await init.pageClick(page, 'input[name=name]');
        await init.pageType(page, 'input[name=name]', utils.user.name);
        await init.pageClick(page, 'input[name=companyName]');
        await init.pageType(
            page,
            'input[name=companyName]',
            utils.user.company.name
        );
        await init.pageClick(page, 'input[name=companyPhoneNumber]');
        await init.pageType(
            page,
            'input[name=companyPhoneNumber]',
            utils.user.phone
        );
        await init.pageClick(page, 'input[name=password]');
        await init.pageType(page, 'input[name=password]', user.password);
        await init.pageClick(page, 'input[name=confirmPassword]');
        await init.pageType(page, 'input[name=confirmPassword]', user.password);
        await init.pageClick(page, 'button[type=submit]');

        await page.waitForSelector('#email_error');
        const errorMsg = await page.$eval(
            '#email_error',
            elem => elem.textContent
        );
        expect(errorMsg).toEqual('Please enter a business email address.');
    }, 160000);

    test('Registration form fields should be cleaned if the user moves to the login form and returns back.', async () => {
        await page.goto(utils.ACCOUNTS_URL + '/register', {
            waitUntil: 'networkidle2',
        });
        await page.waitForSelector('#email');
        await init.pageClick(page, 'input[name=email]');
        await init.pageType(page, 'input[name=email]', user.email);
        await init.pageClick(page, 'input[name=name]');
        await init.pageType(page, 'input[name=name]', utils.user.name);
        await init.pageClick(page, 'input[name=companyName]');
        await init.pageType(
            page,
            'input[name=companyName]',
            utils.user.company.name
        );
        await init.pageClick(page, 'input[name=companyPhoneNumber]');
        await init.pageType(
            page,
            'input[name=companyPhoneNumber]',
            '1234567890'
        );
        await init.pageClick(page, 'input[name=password]');
        await init.pageType(page, 'input[name=password]', '1234567890');
        await init.pageClick(page, 'input[name=confirmPassword]');
        await init.pageType(page, 'input[name=confirmPassword]', '1234567890');

        await init.pageClick(page, '#loginLink a');
        await page.waitForSelector('#signUpLink a');
        await init.pageClick(page, '#signUpLink a');

        await page.waitForSelector('input[name=email]');
        const email = await page.$eval(
            'input[name=email]',
            element => element.value
        );
        expect(email).toEqual('');
    }, 160000);

    test('Registration form fields should be cleaned if the user moves from card form to the login form and returns back.', async () => {
        await page.goto(utils.ACCOUNTS_URL + '/register', {
            waitUntil: 'networkidle2',
        });
        await page.waitForSelector('#email');
        await init.pageClick(page, 'input[name=email]');
        await init.pageType(page, 'input[name=email]', user.email);
        await init.pageClick(page, 'input[name=name]');
        await init.pageType(page, 'input[name=name]', utils.user.name);
        await init.pageClick(page, 'input[name=companyName]');
        await init.pageType(
            page,
            'input[name=companyName]',
            utils.user.company.name
        );
        await init.pageClick(page, 'input[name=companyPhoneNumber]');
        await init.pageType(
            page,
            'input[name=companyPhoneNumber]',
            '1234567890'
        );
        await init.pageClick(page, 'input[name=password]');
        await init.pageType(page, 'input[name=password]', '1234567890');
        await init.pageClick(page, 'input[name=confirmPassword]');
        await init.pageType(page, 'input[name=confirmPassword]', '1234567890');
        await init.pageClick(page, 'button[type=submit]');

        await page.waitForSelector('input[name=cardName]');
        await init.pageClick(page, 'input[name=cardName]');
        await init.pageType(page, 'input[name=cardName]', 'Test name');

        await init.pageClick(page, '#loginLink a');
        await page.waitForSelector('#signUpLink a');
        await init.pageClick(page, '#signUpLink a');

        await page.waitForSelector('input[name=email]');
        const email = await page.$eval(
            'input[name=email]',
            element => element.value
        );
        expect(email).toEqual('');
    }, 160000);

    it('Should register User with valid details', async () => {
        await init.registerUser(user, page);

        await page.waitForSelector('#titleText');
        const innerText = await page.$eval(
            '#titleText',
            elem => elem.innerText
        );
        page.url().should.containEql(utils.DASHBOARD_URL);
        expect(innerText).toEqual('Home');
    }, 160000);
});
