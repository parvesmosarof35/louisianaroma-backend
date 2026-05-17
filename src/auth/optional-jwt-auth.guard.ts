import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Overrides handleRequest to prevent throwing an error if user authentication fails
  handleRequest(err: any, user: any, info: any, context: any) {
    if (err || !user) {
      return null;
    }
    return user;
  }
}
