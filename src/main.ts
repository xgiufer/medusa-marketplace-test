import { Medusa } from 'medusa-extender';
import express = require('express');
import { StoreModule } from './modules/store/store.module';
import { UserModule } from './modules/user/user.module';
import { ProductModule } from './modules/product/product.module';

async function bootstrap() {
    const expressInstance = express();

    await new Medusa(__dirname + '/../', expressInstance).load([
        StoreModule,
        UserModule,
        ProductModule
    ]);

    expressInstance.listen(9000, () => {
        console.info('Server successfully started on port 9000');
    });
}

bootstrap();