import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Types} from "mongoose";

export class WalletWithdrawItem {
	date: Date;
	amount: number;
	invoice: string;
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
export class ArtistWallet {
	_id: Types.ObjectId;

	@Prop({ unique: true })
	artistUuid: string;

	@Prop({ default: 0 })
	balance: number;

	@Prop({ default: '' })
	iban: string;

	@Prop({ default: [] })
	withdrawHistory: WalletWithdrawItem[];
}

export const ArtistWalletSchema = SchemaFactory.createForClass(ArtistWallet);