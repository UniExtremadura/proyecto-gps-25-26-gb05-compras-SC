import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderStatus } from './schemas/order.schema';
import { Model } from 'mongoose';
import { Stripe } from 'stripe';
import { CreateOrderDto } from './dto/create-order.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
	stripe = new Stripe(process.env.STRIPE_API_KEY!);

	constructor(
		@InjectModel(Order.name) private orderModel: Model<Order>,
		private readonly httpService: HttpService,
	) {}

	async findAll(): Promise<Order[]> {
		return this.orderModel.find();
	}

	async findByUserUuid(userUuid: string): Promise<Order[]> {
		return this.orderModel.find({ userUuid });
	}

	async findOneByStripeSessionId(stripeSessionId: string): Promise<Order> {
		const order = await this.orderModel.findOne({ stripeSessionId });
		if (!order) throw new NotFoundException();
		return order;
	}

	async findOneByUuid(uuid: string): Promise<Order> {
		const order = await this.orderModel.findOne({ uuid });
		if (!order) throw new NotFoundException();
		return order;
	}

	async findOneById(id: string): Promise<Order> {
		const order = await this.orderModel.findById(id);
		if (!order) throw new NotFoundException();
		return order;
	}

	async create(createOrderDto: CreateOrderDto) {
		const orderItems = await Promise.all(
			createOrderDto.items.map(async (item) => {
				const type = item.type;
				const uuid = item.uuid;
				const format = item.format;
				const quantity = item.quantity;
				const endpoint =
					type === 'song' ? 'songs' : type === 'album' ? 'albums' : 'products';

				if (format === 'digital' && quantity > 1) throw new BadRequestException();

				const response = await firstValueFrom(
					this.httpService.get(
						`${process.env.CONTENIDOS_SERVICE_BASE_URL}/${endpoint}/${uuid}`,
					),
				);

				return {
					uuid,
					title: response.data.title,
					type,
					format,
					img: response.data.cover,
					price: response.data.pricing[format!],
					quantity,
				};
			}),
		);

		const lineItems = orderItems.map((item) => ({
			price_data: {
				currency: 'eur',
				product_data: {
					name: item.title,
					description: item.format?.toUpperCase(),
					images: ['https://imgpx.com/en/Qh0DIn8Ceqf5.png'],
				},
				unit_amount: item.price,
			},
			quantity: item.quantity,
		}));

		const shippingRequired = orderItems.some((item) => {
			return (
				item.type === 'merch' ||
				item.format === 'cd' ||
				item.format === 'vinyl' ||
				item.format === 'cassette'
			);
		});

		if (shippingRequired) {
			lineItems.push({
				price_data: {
					currency: 'eur',
					product_data: {
						name: 'Envío',
						description: 'Tarifa plana',
						images: ['https://imgpx.com/en/Qh0DIn8Ceqf5.png'],
					},
					unit_amount: 500,
				},
				quantity: 1,
			});
		}

		const session = await this.stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: lineItems,
			mode: 'payment',
			success_url: `${process.env.APP_BASE_URL}/checkout/success`,
			cancel_url: `${process.env.APP_BASE_URL}/checkout/cancel`,
		});

		let totalPrice = 0;
		orderItems.forEach((item) => (totalPrice += item.price + item.quantity));

		const order = await this.orderModel.create({
			userUuid: createOrderDto.userUuid,
			items: orderItems,
			shippingPrice: shippingRequired ? 500 : 0,
			totalPrice,
			stripeSessionId: session.id,
		});

		return { order, session };
	}

	async webhookUpdateStatus(
		stripeSessionId: string,
		status: OrderStatus,
	): Promise<Order> {
		const order = await this.findOneByStripeSessionId(stripeSessionId);
		order.status = status;
		const updatedOrder = await this.orderModel.findByIdAndUpdate(
			order._id,
			order,
			{ new: true },
		);
		return updatedOrder!;
	}

	async update(updateOrderDto: UpdateOrderDto) {
		const order = await this.findOneByUuid(updateOrderDto.uuid);
		return this.orderModel.findByIdAndUpdate(order._id, updateOrderDto, {
			new: true,
		});
	}
}
