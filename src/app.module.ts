import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { OrdersModule } from './modules/orders/orders.module';
import {PaymentsModule} from "./modules/payments/payments.module";

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		MongooseModule.forRoot(process.env.MONGODB_HOST || ''),
		OrdersModule,
		PaymentsModule,
	],
})
export class AppModule {}
