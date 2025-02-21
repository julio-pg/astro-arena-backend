import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Player } from './player.schema';

export type BattleDocument = HydratedDocument<Battle>;

@Schema({ timestamps: true })
export class Battle {
  @Prop({
    required: true,
    unique: true,
    default: () => `astroBattle-${uuidv4().substring(0, 6)}`,
  })
  id: string;

  @Prop({
    type: [{ type: Types.ObjectId }],
    ref: 'Player',
    required: true,
  })
  participants: Types.ObjectId[];

  @Prop({ required: true })
  status: 'active' | 'completed';
  @Prop({ required: false })
  winner: string;
}
export interface BattleSession {
  id: string;
  participants: (Player & {
    _id: Types.ObjectId;
  })[];
  currentTurn: string;
  status: 'active' | 'completed';
}
export const BattleSchema = SchemaFactory.createForClass(Battle);
