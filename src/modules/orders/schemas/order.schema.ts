import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ versionKey: false })
export class Order {
	// TODO: Definir Order
}

export const OrderSchema = SchemaFactory.createForClass(Order);
