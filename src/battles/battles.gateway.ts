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
import { Battle } from './schemas/battle.schema';
import { Player } from './schemas/player.schema';
import { Ability } from './schemas/ability.schema';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: true })
export class BattlesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @InjectModel(Monster.name) private monsterModel: Model<Monster>,
    @InjectModel(Player.name) private playerModel: Model<Player>,
    @InjectModel(Battle.name) private battleModel: Model<Battle>,
  ) {}

  private readonly logger = new Logger(BattlesGateway.name);

  @WebSocketServer() server: Server;
  afterInit() {
    this.logger.log('Astro Arena web-Socket Initialized');
  }
  // private activeBattles = new Map<string, BattleSession>();

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
      console.log(humanPlayer);
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
      const battleSession: Omit<Battle, 'id' | 'winner'> = {
        participants: [humanPlayer._id, pcPlayer._id],
        logs: [],
        currentTurn: humanPlayer.id, // Human player starts first
        status: 'active',
      };

      // Save the battle session to the database
      const newBattleSession = await this.battleModel.create(battleSession);

      // Join the client to the battle room
      client.join(newBattleSession.id);

      // Emit the battle start event with the PC player's details
      this.server.to(newBattleSession.id).emit('battleStarted', {
        battleId: newBattleSession.id,
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

  @SubscribeMessage('attack')
  async handleAttack(
    client: Socket,
    payload: {
      battleId: string;
      attackerId: string;
      attackerMonsterId: string;
      abilityName: string;
      defenderMonsterId: string;
    },
  ) {
    const battle = await this.battleModel
      .findOne({ id: payload.battleId })
      .populate<{
        participants: Array<
          Omit<Player, 'monsters'> & {
            monsters: Array<
              Omit<Monster, 'abilities'> & {
                abilities: Ability[];
              }
            >;
          }
        >;
      }>({
        path: 'participants',
        populate: {
          path: 'monsters', // Populate the creator field in each review
          model: 'Monster', // Specify the model for the creator field
          populate: {
            path: 'abilities',
            model: 'Ability',
          },
        },
      });

    if (
      battle &&
      battle.currentTurn === payload.attackerId &&
      battle.status == 'active'
    ) {
      const attacker = battle.participants.find(
        (player) => player.id === payload.attackerId,
      );
      const defender = battle.participants.find(
        (player) => player.id !== payload.attackerId,
      );
      const attackerMonster = attacker.monsters.find(
        ({ id }) => id == payload.attackerMonsterId,
      );
      const defenderMonster = defender.monsters.find(
        ({ id }) => id == payload.defenderMonsterId,
      );
      const ability = attackerMonster.abilities.find(
        ({ name }) => name == payload.abilityName,
      );
      defenderMonster.healthPoints -= ability.power;
      battle.logs.push(
        `${attackerMonster.name} used ${ability.name} (${ability.power} damage)`,
      );

      // Check if battle ended
      if (defenderMonster.healthPoints <= 0) {
        battle.status = 'completed';
        battle.winner = attacker.name;
        battle.logs = battle.logs;
        battle.save();
        this.server.to(battle.id).emit('battleEnded', {
          winner: attacker.name,
          logs: battle.logs,
        });
      } else {
        battle.currentTurn = defender.id;
        battle.save();
        this.server.to(battle.id).emit('battleUpdate', battle);
      }
    }
  }
  // Additional methods in BattlesGateway
  // @SubscribeMessage('joinBattle')
  // handleJoinBattle(client: Socket, battleId: string) {
  //   const battle = this.activeBattles.get(battleId);
  //   if (battle && battle.status === 'active') {
  //     client.join(battleId);
  //     client.emit('battleState', battle);
  //   }
  // }
}
