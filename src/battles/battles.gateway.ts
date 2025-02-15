// src/battles/battles.gateway.ts
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

@WebSocketGateway({ cors: true })
export class BattlesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private activeBattles = new Map<string, BattleSession>();

  constructor(
    @InjectModel(Monster.name) private monsterModel: Model<Monster>,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('startBattle')
  async handleStartBattle(client: Socket, monsterIds: number[]) {
    const monsters = await this.monsterModel.find({ id: { $in: monsterIds } });

    const battleSession: BattleSession = {
      id: Date.now().toString(),
      participants: monsters,
      logs: [],
      currentTurn: monsterIds[0],
      status: 'active',
    };

    this.activeBattles.set(battleSession.id, battleSession);
    client.join(battleSession.id);
    this.server.to(battleSession.id).emit('battleStarted', battleSession);
  }

  @SubscribeMessage('attack')
  async handleAttack(
    client: Socket,
    payload: { battleId: string; attackerId: number; abilityName: string },
  ) {
    const battle = this.activeBattles.get(payload.battleId);

    if (battle && battle.currentTurn === payload.attackerId) {
      const attacker = battle.participants.find(
        (m) => m.id === payload.attackerId,
      );
      const defender = battle.participants.find(
        (m) => m.id !== payload.attackerId,
      );
      const ability = attacker.abilities.find(
        (a) => a.name === payload.abilityName,
      );

      defender.healthPoints -= ability.power;
      battle.logs.push(
        `${attacker.name} used ${ability.name} (${ability.power} damage)`,
      );

      // Check if battle ended
      if (defender.healthPoints <= 0) {
        battle.status = 'completed';
        this.server.to(battle.id).emit('battleEnded', {
          winner: attacker,
          logs: battle.logs,
        });
        this.activeBattles.delete(battle.id);
      } else {
        battle.currentTurn = defender.id;
        this.server.to(battle.id).emit('battleUpdate', battle);
      }
    }
  }
  // Additional methods in BattlesGateway
  @SubscribeMessage('joinBattle')
  handleJoinBattle(client: Socket, battleId: string) {
    const battle = this.activeBattles.get(battleId);
    if (battle && battle.status === 'active') {
      client.join(battleId);
      client.emit('battleState', battle);
    }
  }

  private checkBattleStatus(battle: BattleSession) {
    if (battle.participants.some((m) => m.healthPoints <= 0)) {
      battle.status = 'completed';
      this.server.to(battle.id).emit('battleEnded', {
        winner: battle.participants.find((m) => m.healthPoints > 0),
        logs: battle.logs,
      });
      this.activeBattles.delete(battle.id);
    }
  }
}

interface BattleSession {
  id: string;
  participants: Monster[];
  logs: string[];
  currentTurn: number;
  status: 'active' | 'completed';
}
