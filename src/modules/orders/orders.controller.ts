import {
	Body,
	Controller,
	Delete,
	Get,
	InternalServerErrorException,
	Param,
	Post,
	Put,
	Redirect,
	UnauthorizedException,
	UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Roles } from '../../auth/roles.decorator';
import { AuthGuard } from '../../auth/auth.guard';
import { SupabaseUser } from '../../auth/user.decorator';
import { type User as SbUser } from '@supabase/supabase-js';

@Controller('orders')
export class OrdersController {
	constructor(private readonly ordersService: OrdersService) {}

	@Get()
	@Roles(['user', 'artist'])
	@UseGuards(AuthGuard)
	async getOrders(@SupabaseUser() sbUser: SbUser) {
		return await this.ordersService.findByUserUuid(sbUser.id);
	}

	@Get(':uuid')
	@Roles(['user', 'artist', 'admin'])
	@UseGuards(AuthGuard)
	async getOrderByUuid(
		@Param('uuid') uuid: string,
		@SupabaseUser() sbUser: SbUser,
	) {
		const order = await this.ordersService.findOneByUuid(uuid);

		if (sbUser.role === 'admin') return order;
		if (sbUser.id !== order.userUuid) throw new UnauthorizedException();

		return order;
	}

	@Post()
	@Roles(['user', 'artist'])
	@UseGuards(AuthGuard)
	async postOrder(
		@SupabaseUser() sbUser: SbUser,
		@Body() createOrderDto: CreateOrderDto,
	) {
		try {
			createOrderDto.userUuid = sbUser.id;
			const result = await this.ordersService.create(createOrderDto);
			return {
				redirectUrl: result.session.url,
				order: result.order,
			};
		} catch (error) {
			throw new InternalServerErrorException();
		}
	}

	@Put(':uuid')
	@Roles(['admin'])
	@UseGuards(AuthGuard)
	async updateOrder(
		@Param('uuid') uuid: string,
		@Body() updateOrderDto: UpdateOrderDto,
	) {
		updateOrderDto.uuid = uuid;
		return await this.ordersService.update(updateOrderDto);
	}
}
