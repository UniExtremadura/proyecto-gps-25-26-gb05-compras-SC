import {BadRequestException, Injectable, NotFoundException} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {ArtistWallet} from "./schemas/artist-wallet.schema";
import {Model} from "mongoose";
import {UpdateWalletDto} from "./dto/update-wallet.dto";
import {Order} from "../orders/schemas/order.schema";
import {HttpService} from "@nestjs/axios";
import {firstValueFrom} from "rxjs";

@Injectable()
export class ArtistWalletService {

	constructor(
		@InjectModel(ArtistWallet.name) private artistWalletModel: Model<ArtistWallet>,
		private readonly httpService: HttpService,
	) {}

	async findByArtistUuid(artistUuid: string): Promise<ArtistWallet> {
		const wallet = await this.artistWalletModel.findOne({ artistUuid });
		if (!wallet) throw new NotFoundException();
		return wallet;
	}

	async create(artistUuid: string): Promise<ArtistWallet> {
		const wallet = await this.artistWalletModel.create({
			artistUuid
		});
		return await wallet.save();
	}

	async update(artistUuid: string, updateWalletDto: UpdateWalletDto) {
		const wallet = this.artistWalletModel.findOneAndUpdate({artistUuid}, updateWalletDto, { new: true });
		if (!wallet) throw new NotFoundException();
		return wallet;
	}

	async addBalance(artistUuid: string, amount: number): Promise<ArtistWallet> {
		const wallet = await this.artistWalletModel.findOne({ artistUuid });
		if (!wallet) throw new NotFoundException();
		wallet.balance += amount;
		return await wallet.save();
	}

	async addFromOrder(order: Order) {
		for (const item of order.items) {
			const type = item.type === 'merch' ? 'products' : item.type === 'song' ? 'songs' : 'albums';
			const response = await firstValueFrom(
				this.httpService.get(`${(process.env.CONTENIDOS_SERVICE_BASE_URL)}/${type}/${item.uuid}`)
			);
			await this.addBalance(response.data.author.uuid, item.price * item.quantity);
		}
	}

	async withdraw(artistUuid: string): Promise<ArtistWallet> {
		const wallet = await this.artistWalletModel.findOne({ artistUuid });
		if (!wallet) throw new NotFoundException();
		if (wallet.iban === '') throw new BadRequestException();
		wallet.withdrawHistory.push({
			date: new Date(),
			invoice: '',
			amount: wallet.balance
		})
		wallet.balance = 0;
		return await wallet.save();
	}
}