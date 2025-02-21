import { Injectable } from '@nestjs/common';

import { Monster } from './schemas/monster.schema';
import { Player } from './schemas/player.schema';
import { Battle } from './schemas/battle.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAbilityDto } from './dto/create-ability.dto';
import { Ability } from './schemas/ability.schema';
import { CreateMonsterDto } from './dto/create-monster.dto';
import { CreatePlayerDto } from './dto/create-player.dto';

@Injectable()
export class BattlesService {
  constructor(
    @InjectModel(Monster.name) private monsterModel: Model<Monster>,
    @InjectModel(Player.name) private playerModel: Model<Player>,
    @InjectModel(Battle.name) private battleModel: Model<Battle>,
    @InjectModel(Ability.name) private AbilityModel: Model<Ability>,
  ) {}
  async createAbility(createAbilityDto: CreateAbilityDto) {
    return await this.AbilityModel.create(createAbilityDto);
  }
  async createMonster(createMonsterDto: CreateMonsterDto) {
    return await this.monsterModel.create(createMonsterDto);
  }
  async createPlayer(createPlayerDto: CreatePlayerDto) {
    return await this.playerModel.create(createPlayerDto);
  }

  findLastBattles() {
    return this.battleModel
      .find({})
      .populate('participants')
      .sort({ createdAt: -1 })
      .limit(5);
  }

  async findOnePlayer(id: string) {
    return await this.playerModel.find({ id });
  }
}
