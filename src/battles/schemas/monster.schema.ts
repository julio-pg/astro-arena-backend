import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
// import { Ability } from './ability.schema';

export type MonsterDocument = HydratedDocument<Monster>;

@Schema()
export class Monster {
  @Prop({
    required: true,
    unique: true,
    default: () => `monster-${uuidv4().substring(0, 6)}`,
  })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  image: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true, default: 100 })
  healthPoints: number;

  @Prop({
    type: [{ type: Types.ObjectId }],
    ref: 'Ability',
    required: true,
  })
  abilities: Types.ObjectId[];
}

export const MonsterSchema = SchemaFactory.createForClass(Monster);
