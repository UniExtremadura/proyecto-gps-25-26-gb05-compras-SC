import {
	Controller,
	Headers,
	HttpCode,
	HttpStatus,
	InternalServerErrorException,
	Post,
	type RawBodyRequest,
	Req,
	Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Stripe } from 'stripe';
import { OrderStatus } from './schemas/order.schema';
import {ArtistWalletService} from "../payments/artist-wallet.service";

@Controller('stripe/webhook')
export class WebhookController {
	stripe = new Stripe(process.env.STRIPE_API_KEY!);

	constructor(
		private readonly ordersService: OrdersService,
		private readonly artistWalletService: ArtistWalletService
	) {}

	@Post()
	@HttpCode(HttpStatus.ACCEPTED)
	async postWebhook(
		@Headers('stripe-signature') stripeSignature: string,
		@Req() req: RawBodyRequest<Request>,
	) {
		try {
			const body = req.rawBody!;
			const event = this.stripe.webhooks.constructEvent(
				body,
				stripeSignature,
				process.env.STRIPE_WEBHOOK_SECRET!,
			);
			if (
				event.type === 'checkout.session.completed' ||
				event.type === 'checkout.session.async_payment_succeeded'
			) {
				await this.ordersService.webhookUpdateStatus(
					event.data.object.id,
					OrderStatus.PAID,
				);
				await this.ordersService.addDigitalLibraryToUser(event.data.object.id);
				await this.artistWalletService.addFromOrder(await this.ordersService.findOneByStripeSessionId(event.data.object.id));
			} else if (
				event.type === 'checkout.session.expired' ||
				event.type === 'checkout.session.async_payment_failed'
			) {
				await this.ordersService.webhookUpdateStatus(
					event.data.object.id,
					OrderStatus.CANCELLED,
				);
			}
		} catch (error) {
			console.log(error);
			throw new InternalServerErrorException();
		}
	}
}
