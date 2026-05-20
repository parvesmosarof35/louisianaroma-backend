import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, headers, body, query } = req;
    
    console.log(`\n⚜️  [INCOMING REQUEST]  ⚜️`);
    console.log(`Route/URL:  ${method} ${originalUrl}`);
    
    if (Object.keys(query).length > 0) {
      console.log(`Query:     `, JSON.stringify(query, null, 2));
    }
    
    console.log(`Headers:   `, JSON.stringify(headers, null, 2));
    
    if (body && Object.keys(body).length > 0) {
      console.log(`Payload:   `, JSON.stringify(body, null, 2));
    } else {
      console.log(`Payload:    [Empty]`);
    }
    
    console.log(`⚜️  [END REQUEST METADATA]  ⚜️\n`);
    
    next();
  }
}
