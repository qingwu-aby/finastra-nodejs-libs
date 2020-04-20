import { UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, TokenSet } from 'openid-client';
import { JwtService } from '@nestjs/jwt';
import { UserInfoMethod } from '../interfaces/oidc-module-options.interface';
import { OidcHelpers } from '../utils';

export class OidcStrategy extends PassportStrategy(Strategy, 'oidc') {
  constructor(
    private jwtService: JwtService,
    private oidcHelpers: OidcHelpers,
  ) {
    super({
      client: oidcHelpers.client,
      params: {
        redirect_uri: oidcHelpers.config.redirectUriLogin,
        scope: oidcHelpers.config.scopes,
      },
      passReqToCallback: false,
      usePKCE: false,
    });
  }

  async validate(tokenset: TokenSet): Promise<any> {
    const userinfo =
      this.oidcHelpers.config.userInfoMethod === UserInfoMethod.ffdc
        ? this.userInfoFFDC(tokenset)
        : this.getUserInfo(tokenset);

    const id_token = tokenset.id_token;
    const access_token = tokenset.access_token;
    const refresh_token = tokenset.refresh_token;
    const user = {
      id_token,
      access_token,
      refresh_token,
      userinfo,
    };
    return user;
  }

  private async getUserInfo(tokenset: TokenSet) {
    try {
      return await this.oidcHelpers.client.userinfo(tokenset);
    } catch (err) {
      throw new UnauthorizedException();
    }
  }

  private userInfoFFDC(tokenset: TokenSet) {
    const identity: any = this.jwtService.decode(tokenset.id_token);
    return {
      username: identity.username,
    };
  }
}
