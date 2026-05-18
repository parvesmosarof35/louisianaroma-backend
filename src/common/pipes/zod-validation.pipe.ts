import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { Schema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: Schema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error: any) {
      const issues = error.issues || error.errors;
      const errorMessages = Array.isArray(issues)
        ? issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ')
        : error.message;
      throw new BadRequestException(errorMessages);
    }
  }
}
