import { z } from 'zod';

export const CreateCollectionSchema = z.object({
  name: z.string().min(2, 'Collection name must have at least 2 characters.'),
  image: z.string().url('Collection image must be a valid URL.'),
});

export const UpdateCollectionSchema = CreateCollectionSchema.partial();

export class CreateCollectionDto {
  name!: string;
  image!: string;
}

export class UpdateCollectionDto {
  name?: string;
  image?: string;
}
