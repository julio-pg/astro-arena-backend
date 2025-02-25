import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AbilityDocument = HydratedDocument<Ability>;

@Schema()
export class Ability {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  power: number;
}

export const AbilitySchema = SchemaFactory.createForClass(Ability);
