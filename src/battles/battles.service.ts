import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

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
  ) {}
  private readonly logger = new Logger(BattlesService.name);

  private model: tf.LayersModel;

  async onModuleInit() {
    try {
      this.model = await tf.loadLayersModel(
        'file://./src/battles/models/my-model/opponent.json',
      );
      this.logger.log('AI model loaded successfully.');
    } catch (error) {
      this.logger.error('Failed to load AI model:', error);
      throw error;
    }
  }
  // Predict the best monster for the AI to activate
  predictBestMonster(playerMonster: Monster, aiMonsters: Monster[]) {
    if (!this.model) {
      throw new Error('AI model is not loaded.');
    }

    try {
      const types = ['fire', 'grass', 'water', 'electric', 'ground'];

      // Map monster types to numerical values
      const typeToNumber = {
        fire: 0,
        grass: 1,
        water: 2,
        electric: 3,
        ground: 4,
      };

      const numberToType = {
        0: 'fire',
        1: 'grass',
        2: 'water',
        3: 'electric',
        4: 'ground',
      };

      // Ensure playerMonster.type is valid
      if (!(playerMonster.type in typeToNumber)) {
        throw new Error(`Invalid player monster type: ${playerMonster.type}`);
      }

      // Encode player's monster type
      const playerMonsterIndex = typeToNumber[playerMonster.type];
      const playerIndexNormalized = playerMonsterIndex / (types.length - 1);
      // Encode AI's available monsters as a multi-hot vector
      const aiMonsterAvailability = new Array(5).fill(0); // 5 types: fire, grass, water, electric, ground
      aiMonsters.forEach((monster) => {
        if (!(monster.type in typeToNumber)) {
          throw new Error(`Invalid AI monster type: ${monster.type}`);
        }
        aiMonsterAvailability[typeToNumber[monster.type]] = 1;
      });

      // Create input tensor
      const input = tf.tensor2d([
        [playerIndexNormalized, ...aiMonsterAvailability],
      ]);

      // Debug: Log input tensor
      console.log('Input Tensor:', input.arraySync());

      // Make a prediction
      const prediction = this.model.predict(input) as tf.Tensor;

      const bestTypeIndex = prediction.argMax(1).dataSync()[0];

      // Map the predicted index back to a monster type
      const bestType = numberToType[bestTypeIndex];

      if (!bestType) {
        throw new Error(`Invalid predicted type index: ${bestTypeIndex}`);
      }

      // Find the corresponding monster
      const bestMonster = aiMonsters.find(
        (monster) => monster.type === bestType,
      );

      if (!bestMonster) {
        throw new Error(`No matching monster found for type: ${bestType}`);
      }

      // Dispose of tensors to free memory
      input.dispose();
      prediction.dispose();

      return bestMonster;
    } catch (error) {
      console.error('Error in predictBestMonster:', error.message);
      throw error; // Re-throw the error for the caller to handle
    }
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
