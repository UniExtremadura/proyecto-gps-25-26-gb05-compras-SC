import { Injectable } from '@nestjs/common';
import { supabase } from '../../lib/supabase';

interface TokenData {
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
}

@Injectable()
export class ServiceTokenProvider {
	private email: string = process.env.SERVICE_AUTH_EMAIL!;
	private password: string = process.env.SERVICE_AUTH_PASSWORD!;
	private tokenData: TokenData;

	constructor() {
		this.refreshToken();
	}

	async getToken(): Promise<string> {
		if (this.isTokenExpiring()) {
			await this.refreshToken();
		}
		return this.tokenData.accessToken;
	}

	async refreshToken(): Promise<void> {
		const user = await supabase.auth.signInWithPassword({
			email: this.email,
			password: this.password,
		});
		this.tokenData = {
			accessToken: user.data.session!.access_token,
			refreshToken: user.data.session!.refresh_token,
			expiresAt: user.data.session!.expires_at!,
		};
	}

	private isTokenExpiring(): boolean {
		const currentTime = Math.floor(Date.now() / 1000);
		const timeUntilExpiry = this.tokenData.expiresAt - currentTime;
		return timeUntilExpiry < 60;
	}
}
