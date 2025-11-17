import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import {IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength} from "class-validator";

export type OrderDocument = HydratedDocument<Order>;

export enum OrderStatus {
	PENDING_PAYMENT = 'pending_payment',
	PAID = 'paid',
	PREPARING = 'preparing',
	SHIPPED = 'shipped',
	DELIVERED = 'delivered',
	CANCELLED = 'cancelled',
}

export interface OrderItem {
	uuid: string;
	title: string;
	type: 'album' | 'song' | 'merch';
	format?: 'cd' | 'vinyl' | 'cassette' | 'digital';
	img: string;
	price: number;
	quantity: number;
}

export class OrderAddress {
	@IsNotEmpty()
	@IsString()
	recipientName: string;

	@IsNotEmpty()
	@IsString()
	street: string;

	@IsOptional()
	@IsString()
	additionalInfo: string;

	@IsNotEmpty()
	@IsString()
	city: string;

	@IsNotEmpty()
	@IsString()
	state: string;

	@IsNotEmpty()
	@IsString()
	@MaxLength(5)
	zipCode: string;

	@IsNotEmpty()
	@IsNumber()
	phoneNumber: number;
}

@Schema({
	versionKey: false,
	toJSON: {
		transform: (doc, ret) => {
			const { _id, ...rest } = ret;
			return rest;
		},
	},
})
export class Order {
	_id: Types.ObjectId;

	@Prop({ unique: true, default: () => uuidv4() })
	uuid: string;

	@Prop({ required: true })
	userUuid: string;

	@Prop({ default: () => Date.now() })
	creationDate: Date;

	@Prop({ default: OrderStatus.PENDING_PAYMENT })
	status: OrderStatus;

	@Prop({ required: true })
	items: OrderItem[];

	@Prop({ required: true })
	address: OrderAddress;

	@Prop({ required: true })
	shippingPrice: number;

	@Prop({ required: true })
	totalPrice: number;

	@Prop({ required: true, unique: true })
	stripeSessionId: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
