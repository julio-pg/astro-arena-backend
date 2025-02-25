import { Module } from '@nestjs/common';
import { BattlesService } from './battles.service';
import { BattlesGateway } from './battles.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Monster, MonsterSchema } from './schemas/monster.schema';
import { Ability, AbilitySchema } from './schemas/ability.schema';
import { Player, PlayerSchema } from './schemas/player.schema';
import { Battle, BattleSchema } from './schemas/battle.schema';
import { BattlesController } from './battles.controler ';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Monster.name, schema: MonsterSchema },
      { name: Ability.name, schema: AbilitySchema },
      { name: Player.name, schema: PlayerSchema },
      { name: Battle.name, schema: BattleSchema },
    ]),
  ],
  controllers: [BattlesController],

  providers: [BattlesGateway, BattlesService],
})
export class BattlesModule {}
