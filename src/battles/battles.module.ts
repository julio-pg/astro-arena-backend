import { Module } from '@nestjs/common';
import { BattlesService } from './battles.service';
import { BattlesGateway } from './battles.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Monster, MonsterSchema } from './schemas/monster.schema';
import { Ability, AbilitySchema } from './schemas/ability.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Monster.name, schema: MonsterSchema },
      { name: Ability.name, schema: AbilitySchema },
    ]),
  ],
  providers: [BattlesGateway, BattlesService],
})
export class BattlesModule {}
