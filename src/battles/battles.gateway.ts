import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Monster } from './schemas/monster.schema';
import { Battle, BattleSession } from './schemas/battle.schema';
import { Player } from './schemas/player.schema';
import { Ability } from './schemas/ability.schema';
import { Logger } from '@nestjs/common';
import { BattlesService } from './battles.service';

@WebSocketGateway({ cors: true })
export class BattlesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @InjectModel(Monster.name) private monsterModel: Model<Monster>,
    @InjectModel(Player.name) private playerModel: Model<Player>,
    @InjectModel(Battle.name) private battleModel: Model<Battle>,
    private readonly battlesService: BattlesService,
  ) {}

  private readonly logger = new Logger(BattlesGateway.name);

  @WebSocketServer() server: Server;
  afterInit() {
    this.logger.log('Astro Arena web-Socket Initialized');
  }
  private activeBattles = new Map<string, BattleSession>();

  handleConnection(client: Socket) {
    const { sockets } = this.server.sockets;

    this.logger.log(`Client id: ${client.id} connected`);
    this.logger.debug(`Number of connected clients: ${sockets.size}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client id:${client.id} disconnected`);
    this.server.emit('room', client.id + ' left!');
  }
  @SubscribeMessage('startBattle')
  async handleStartBattle(
    @MessageBody('playerId') playerId: string,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.logger.debug(`player ${playerId} starts a battle`);

      // Fetch the human player
      const humanPlayer = await this.playerModel
        .findOne({ id: playerId })
        .populate({
          path: 'monsters', // Populate the creator field in each review
          model: 'Monster', // Specify the model for the creator field
          populate: {
            path: 'abilities',
            model: 'Ability',
          },
        })
        .exec();
      if (!humanPlayer) {
        throw new Error('Player not found');
      }

      // Fetch or create the PC player
      let pcPlayer = await this.playerModel
        .findOne({ name: 'PC' })
        .populate({
          path: 'monsters', // Populate the creator field in each review
          model: 'Monster', // Specify the model for the creator field
          populate: {
            path: 'abilities',
            model: 'Ability',
          },
        })
        .exec();
      if (!pcPlayer) {
        // Create a default PC player if it doesn't exist
        pcPlayer = await this.playerModel.create({
          name: 'PC',
          monsters: [], // Add default monsters for the PC
          isPC: true, // Mark this player as a PC
        });
      }

      // Create the battle session
      const battleSession: BattleSession = {
        id: Date.now().toString(), // Unique battle ID
        participants: [humanPlayer, pcPlayer],
        currentTurn: humanPlayer.id, // Human player starts first
        status: 'active',
      };

      // Save the battle session to the database
      this.activeBattles.set(battleSession.id, battleSession);

      // Join the client to the battle room
      client.join(battleSession.id);

      // Emit the battle start event with the PC player's details
      this.server.to(battleSession.id).emit('battleStarted', {
        id: battleSession.id,
        participants: [humanPlayer, pcPlayer],
        logs: [],
        currentTurn: humanPlayer.id,
        status: 'active',
      });
    } catch (error) {
      // Handle errors and notify the client
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('activeMonster')
  async handleActiveMonster(
    @ConnectedSocket() client: Socket,
    @MessageBody('playerId') playerId: string,
    @MessageBody('monsterId') monsterId: string,
    @MessageBody('battleId') battleId: string,
  ) {
    try {
      const battle = this.activeBattles.get(battleId);

      if (!battle) {
        throw new Error('Battle not found');
      }

      const player = await this.playerModel.findOne({ id: playerId });
      if (!player) {
        throw new Error('Player not found');
      }
      const monster = await this.monsterModel.findOne({ id: monsterId });
      if (!monster) {
        throw new Error('Monster not found');
      }

      // Notify clients about the player's action
      this.server.to(battle.id).emit('monsterActivated', {
        message: `${player.name} summoned ${monster.name}`,
        monsterId: monster.id,
        nextTurn: battle.participants.find((p) => p.id !== playerId).id,
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
  @SubscribeMessage('pcMonster')
  async handlePcActiveMonster(
    @ConnectedSocket() client: Socket,
    @MessageBody('battleId') battleId: string,
    @MessageBody('playerMonster') playerMonster: Monster,
    @MessageBody('availableMonsters') availableMonsters: Monster[],
  ) {
    try {
      const battle = this.activeBattles.get(battleId);

      if (!battle) {
        throw new Error('Battle not found');
      }
      // Find the PC player
      const pcPlayer = battle.participants.find((p) => p.name == 'PC');
      if (!pcPlayer) {
        throw new Error('PC player not found');
      }

      // Select a random monster from the PC's monsters
      if (availableMonsters.length === 0) {
        throw new Error('PC has no monsters');
      }
      const bestOptionMonster = this.battlesService.predictBestMonster(
        playerMonster,
        availableMonsters,
      );
      console.log(bestOptionMonster.name);
      // const randomMonster =
      //   availableMonsters[Math.floor(Math.random() * availableMonsters.length)];

      this.server.to(battle.id).emit('pcMonsterActivated', {
        message: `${pcPlayer.name} summoned ${bestOptionMonster.name}`,
        monsterId: bestOptionMonster.id,
        nextTurn: battle.participants.find((p) => p.id !== pcPlayer.id).id,
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
  @SubscribeMessage('attack')
  async handleAttack(
    @ConnectedSocket() client: Socket,
    @MessageBody('battleId') battleId: string,
    @MessageBody('attackerId') attackerId: string,
    @MessageBody('attackerMonsterId') attackerMonsterId: string,
    @MessageBody('abilityName') abilityName: string,
    // @MessageBody('defenderMonsterId') defenderMonsterId: string,
  ) {
    try {
      const battle = this.activeBattles.get(battleId);
      if (!battle) {
        throw new Error('Battle not found');
      }
      if (battle && battle.status == 'active') {
        const attackerMonster = await this.monsterModel
          .findOne({
            id: attackerMonsterId,
          })
          .populate<{ abilities: Ability[] }>('abilities');

        if (!attackerMonster) {
          throw new Error('Monster not found');
        }

        const ability = attackerMonster.abilities.find(
          ({ name }) => name == abilityName,
        );
        if (!ability) {
          throw new Error('Ability not found');
        }

        this.server.to(battle.id).emit('battleUpdate', {
          name: ability.name,
          damage: ability.power,
          message: `${attackerMonster.name} used ${ability.name}`,
          nextTurn: battle.participants.find((p) => p.name == 'PC').id,
        });
      }
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
  @SubscribeMessage('pcAttack')
  async handlePcAttack(
    @ConnectedSocket() client: Socket,
    @MessageBody('battleId') battleId: string,
    @MessageBody('pcMonsterId') pcMonsterId: string,
  ) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }
    if (battle && battle.status == 'active') {
      const monster = await this.monsterModel
        .findOne({
          id: pcMonsterId,
        })
        .populate<{ abilities: Ability[] }>('abilities');
      const selectedAbility =
        monster.abilities[Math.floor(Math.random() * monster.abilities.length)]
          .name;
      const ability = monster.abilities.find(
        (ability) => ability.name === selectedAbility,
      );
      this.server.to(battleId).emit('pcUpdate', {
        name: ability.name,
        damage: ability.power,
        message: `${monster.name} used ${ability.name}`,
        nextTurn: battle.participants.find((p) => p.name !== 'PC').id,
      });
    }
    try {
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
  @SubscribeMessage('endBattle')
  async handleEndBattle(
    @ConnectedSocket() client: Socket,
    @MessageBody('battleId') battleId: string,
    @MessageBody('winnerId') winnerId: string,
  ) {
    try {
      const battle = this.activeBattles.get(battleId);
      if (!battle) {
        throw new Error('Battle not found');
      }
      await this.battleModel.create({
        participants: battle.participants.map((p) => p._id),
        status: 'completed',
        winner: winnerId,
      });
      this.server.to(battleId).emit('battleEnded', {
        winner: battle.participants.find((p) => p.id === winnerId).name,
        // message: `${monster.name} used ${ability.name}`,
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
}
