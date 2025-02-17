import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type BattleDocument = HydratedDocument<Battle>;

@Schema()
export class Battle {
  @Prop({
    required: true,
    unique: true,
    default: () => `astroBattle-${uuidv4().substring(0, 6)}`,
  })
  id: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Player',
    required: true,
  })
  participants: Types.ObjectId[];

  @Prop({ required: true })
  currentTurn: string;

  @Prop({ required: true })
  logs: string[];

  @Prop({ required: true })
  status: 'active' | 'completed';
  @Prop({ required: false })
  winner: string;
}

export const BattleSchema = SchemaFactory.createForClass(Battle);
