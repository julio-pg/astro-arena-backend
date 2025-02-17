import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Monster } from './schemas/monster.schema';
import { Battle } from './schemas/battle.schema';
import { Player } from './schemas/player.schema';
import { Ability } from './schemas/ability.schema';

@WebSocketGateway({ cors: true })
export class BattlesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  // private activeBattles = new Map<string, BattleSession>();

  constructor(
    @InjectModel(Monster.name) private monsterModel: Model<Monster>,
    @InjectModel(Player.name) private playerModel: Model<Player>,
    @InjectModel(Battle.name) private battleModel: Model<Battle>,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('startBattle')
  async handleStartBattle(client: Socket, playerIds: string[]) {
    const players = await this.playerModel
      .find({ id: { $in: playerIds } })
      .exec();

    const playerIdsObject = players.map((player) => player._id);

    const battleSession: Omit<Battle, 'id' | 'winner'> = {
      participants: playerIdsObject,
      logs: [],
      currentTurn: playerIds[0],
      status: 'active',
    };

    const newBattleSession = await this.battleModel.create(battleSession);
    client.join(newBattleSession.id);
    this.server.to(newBattleSession.id).emit('battleStarted', battleSession);
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
