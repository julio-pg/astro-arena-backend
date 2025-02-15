import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
// import { Ability } from './ability.schema';

@Schema()
export class Monster extends Document {
  @Prop({ required: true, unique: true })
  id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  image: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true, default: 100 })
  healthPoints: number;

  @Prop({
    type: Types.ObjectId,
    ref: 'Ability',
    required: true,
  })
  abilities: Types.ObjectId[];
}

export const MonsterSchema = SchemaFactory.createForClass(Monster);
