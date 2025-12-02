import {IsIBAN, IsNotEmpty, IsString} from "class-validator";

export class UpdateWalletDto {
	@IsNotEmpty()
	@IsIBAN()
	iban: string;
}