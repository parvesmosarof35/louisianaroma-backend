import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class LuxuryExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected elegance divergence occurred in the olfactory chamber.';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resContent: any = exception.getResponse();
      message = typeof resContent === 'string' ? resContent : resContent.message || message;
      details = typeof resContent === 'object' ? resContent : null;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // A brand-aligned premium response format
    response.status(status).json({
      success: false,
      meta: {
        brand: 'Maison Louisianaroma',
        curator: 'Atelier Olfactif Support',
        timestamp: new Date().toISOString(),
      },
      error: {
        code: status,
        message: this.getLuxuryTranslation(message, status),
        details: details?.message || details || null,
      },
    });
  }

  private getLuxuryTranslation(message: string, status: number): string {
    // Custom luxury brand translations for common server errors
    if (status === 401) {
      return 'The private reserve is locked. Please present your credentials to proceed.';
    }
    if (status === 403) {
      return 'Access to this bespoke formulation is restricted to specific curators.';
    }
    if (status === 404) {
      return 'The olfactory silhouette you are searching for cannot be found in our current collections.';
    }
    if (status === 400) {
      return `Formulation inputs require refinement: ${message}`;
    }
    return message;
  }
}
