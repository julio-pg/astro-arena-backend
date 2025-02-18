import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type PlayerDocument = HydratedDocument<Player>;

@Schema()
export class Player {
  @Prop({
    required: true,
    unique: true,
    default: () => `astroPlayer-${uuidv4().substring(0, 6)}`,
  })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Monster',
    required: true,
  })
  monsters: Types.ObjectId[];
}

export const PlayerSchema = SchemaFactory.createForClass(Player);
