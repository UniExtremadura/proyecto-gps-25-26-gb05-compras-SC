import { OrderStatus } from '../schemas/order.schema';
import { IsEnum, IsString, ValidateIf } from 'class-validator';

export class UpdateOrderDto {
	uuid: string;

	@ValidateIf((o: UpdateOrderDto) => o.status !== undefined)
	@IsEnum(OrderStatus)
	status?: OrderStatus;

	@ValidateIf((o: UpdateOrderDto) => o.stripeSessionId !== undefined)
	@IsString()
	stripeSessionId?: string;
}
