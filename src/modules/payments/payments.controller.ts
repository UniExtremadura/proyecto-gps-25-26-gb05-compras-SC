import {Body, Controller, Get, HttpCode, HttpStatus, Post, Put, UseGuards} from "@nestjs/common";
import {ArtistWalletService} from "./artist-wallet.service";
import {Roles} from "../../auth/roles.decorator";
import {AuthGuard} from "../../auth/auth.guard";
import {SupabaseUser} from "../../auth/user.decorator";
import { type User as SbUser } from "@supabase/supabase-js";
import {UpdateWalletDto} from "./dto/update-wallet.dto";
import {CreateWalletDto} from "./dto/create-wallet.dto";

@Controller('payments')
export class PaymentsController {
	constructor(private readonly artistWalletService: ArtistWalletService) {}

	@Get('wallet')
	@Roles(['artist'])
	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	async getWallet(@SupabaseUser() sbUser: SbUser) {
		return await this.artistWalletService.findByArtistUuid(sbUser.id);
	}

	@Post('wallet')
	@Roles(['admin'])
	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	async postWallet(@Body() createWalletDto: CreateWalletDto) {
		return await this.artistWalletService.create(createWalletDto.artistUuid);
	}

	@Put('wallet')
	@Roles(['artist'])
	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	async updateWallet(
		@SupabaseUser() sbUser: SbUser,
		@Body() updateWalletDto: UpdateWalletDto,
	) {
		return await this.artistWalletService.update(sbUser.id, updateWalletDto);
	}

	@Post('wallet/withdraw')
	@Roles(['artist'])
	@UseGuards(AuthGuard)
	@HttpCode(HttpStatus.OK)
	async withdraw(@SupabaseUser() sbUser: SbUser) {
		return await this.artistWalletService.withdraw(sbUser.id);
	}
}