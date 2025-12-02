import {
	ArrayNotEmpty,
	IsArray,
	IsIn,
	IsNotEmpty,
	IsNumber,
	Min,
	ValidateIf,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {OrderAddress} from "../schemas/order.schema";

export class OrderItem {
	@IsNotEmpty()
	@IsIn(['song', 'album', 'merch'])
	type: 'song' | 'album' | 'merch';

	@IsNotEmpty()
	uuid: string;

	@ValidateIf((o: OrderItem) => o.type === 'song' || o.type === 'album')
	@IsNotEmpty()
	@IsIn(['cd', 'vinyl', 'cassette', 'digital'])
	format?: 'cd' | 'vinyl' | 'cassette' | 'digital';

	@IsNotEmpty()
	@IsNumber()
	@Min(1)
	quantity: number;
}

export class CreateOrderDto {
	@IsNotEmpty()
	@IsArray()
	@ArrayNotEmpty()
	@ValidateNested({ each: true })
	@Type(() => OrderItem)
	items: OrderItem[];

	@IsNotEmpty()
	@ValidateNested()
	@Type(() => OrderAddress)
	address: OrderAddress;

	userUuid: string;
}
