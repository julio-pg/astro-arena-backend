import { Injectable, OnModuleInit } from '@nestjs/common';

import { Monster } from './schemas/monster.schema';
import { Player } from './schemas/player.schema';
import { Battle } from './schemas/battle.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAbilityDto } from './dto/create-ability.dto';
import { Ability } from './schemas/ability.schema';
import { CreateMonsterDto } from './dto/create-monster.dto';
import { CreatePlayerDto } from './dto/create-player.dto';
import * as tf from '@tensorflow/tfjs-node';

@Injectable()
export class BattlesService implements OnModuleInit {
  constructor(
    @InjectModel(Monster.name) private monsterModel: Model<Monster>,
    @InjectModel(Player.name) private playerModel: Model<Player>,
    @InjectModel(Battle.name) private battleModel: Model<Battle>,
    @InjectModel(Ability.name) private AbilityModel: Model<Ability>,
    private model: tf.LayersModel,
  ) {}

  async onModuleInit() {
    try {
      this.model = await tf.loadLayersModel('./models/opponent.json');
      console.log('AI model loaded successfully.');
    } catch (error) {
      console.error('Failed to load AI model:', error);
      throw error;
    }
  }
  // Predict the best monster for the AI to activate
  private predictBestMonster(
    playerMonster: { type: string },
    aiMonsters: { type: string }[],
  ) {
    if (!this.model) {
      throw new Error('AI model is not loaded.');
    }

    // Map monster types to numerical values
    const typeToNumber = { Fire: 0, Grass: 1, Water: 2 };

    // Prepare input tensor
    const input = tf.tensor2d([
      [
        typeToNumber[playerMonster.type],
        ...aiMonsters.map((monster) => typeToNumber[monster.type]),
      ],
    ]);

    // Make a prediction
    const prediction = this.model.predict(input) as tf.Tensor;
    const bestTypeIndex = prediction.argMax(1).dataSync()[0];

    // Map the predicted index back to a monster type
    const bestType = Object.keys(typeToNumber).find(
      (key) => typeToNumber[key] === bestTypeIndex,
    );

    // Find the corresponding monster
    const bestMonster = aiMonsters.find((monster) => monster.type === bestType);
    return bestMonster;
  }
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
      .limit(3);
  }

  async findOnePlayer(id: string) {
    return await this.playerModel.find({ id });
  }
}
