import { PostgresAppInstance } from 'CommonServer/Infrastructure/PostgresDatabase';
import Redis from 'CommonServer/Infrastructure/Redis';
import logger from 'CommonServer/Utils/Logger';
import App from 'CommonServer/Utils/StartServer';

// Worker import.
import './Jobs/ScheduledMaintenance/ChangeStateToOngoing';
import './Jobs/PaymentProvider/CheckSubscriptionStatus';

// Announcements. 
import './Jobs/Announcement/SendEmailToSubscribers';

// Certs Routers
import StausPageCerts from './Jobs/StatusPageCerts/StausPageCerts';
import Express, { ExpressApplication } from 'CommonServer/Utils/Express';

const APP_NAME: string = 'workers';

const app: ExpressApplication = Express.getExpressApp();

//cert routes.
app.use(StausPageCerts);

const init: Function = async (): Promise<void> => {
    try {
        // init the app
        await App(APP_NAME);
        // connect to the database.
        await PostgresAppInstance.connect(
            PostgresAppInstance.getDatasourceOptions()
        );

        // connect redis
        await Redis.connect();
    } catch (err) {
        logger.error('App Init Failed:');
        logger.error(err);
    }
};

init();
