import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { HttpModule } from '@nestjs/axios';
import { ServiceTokenProvider } from '../../common/providers/service-token.provider';
import { WebhookController } from './webhook.controller';
import {PaymentsModule} from "../payments/payments.module";

@Module({
	imports: [
		MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
		HttpModule,
		PaymentsModule,
	],
	controllers: [OrdersController, WebhookController],
	providers: [OrdersService, ServiceTokenProvider],
})
export class OrdersModule {}
