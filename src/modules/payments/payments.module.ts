import {Module} from "@nestjs/common";
import {MongooseModule} from "@nestjs/mongoose";
import {HttpModule} from "@nestjs/axios";
import {ArtistWalletService} from "./artist-wallet.service";
import {PaymentsController} from "./payments.controller";
import {ArtistWallet, ArtistWalletSchema} from "./schemas/artist-wallet.schema";
import {ServiceTokenProvider} from "../../common/providers/service-token.provider";

@Module({
	imports: [
		MongooseModule.forFeature([{ name: ArtistWallet.name, schema: ArtistWalletSchema }]),
		HttpModule,
	],
	controllers: [PaymentsController],
	providers: [ArtistWalletService, ServiceTokenProvider],
	exports: [ArtistWalletService]
})
export class PaymentsModule {}