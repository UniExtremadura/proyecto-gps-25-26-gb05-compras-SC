import {
	CanActivate,
	ExecutionContext,
	Injectable,
	InternalServerErrorException,
	UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { supabase } from '../lib/supabase';
import { Reflector } from '@nestjs/core';
import { Roles } from './roles.decorator';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ServiceTokenProvider } from '../common/providers/service-token.provider';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly httpService: HttpService,
		private readonly serviceTokenProvider: ServiceTokenProvider,
	) {}

	private extractTokenFromHeader(request: Request): string | undefined {
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();

		const token = this.extractTokenFromHeader(request);
		if (!token) throw new UnauthorizedException();

		const { data, error } = await supabase.auth.getUser(token);
		if (error) throw new UnauthorizedException();

		const roles = this.reflector.get(Roles, context.getHandler());
		if (!roles) {
			request.user = data.user;
			return true;
		}

		let userRole: 'user' | 'artist' | 'admin';

		try {
			const serviceToken = await this.serviceTokenProvider.getToken();
			const roleResponse = await firstValueFrom(
				this.httpService.get(
					`${process.env.USUARIOS_SERVICE_BASE_URL}/users/${data.user?.id}`,
					{
						headers: {
							Authorization: `Bearer ${serviceToken}`,
						},
					},
				),
			);
			userRole = roleResponse.data.role;
		} catch (error) {
			throw new InternalServerErrorException();
		}

		if (!roles.includes(userRole)) throw new UnauthorizedException();

		request.user = data.user;
		request.user.role = userRole;

		return true;
	}
}
