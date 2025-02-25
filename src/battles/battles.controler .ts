import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BattlesService } from './battles.service';
import { CreateAbilityDto } from './dto/create-ability.dto';
import { CreateMonsterDto } from './dto/create-monster.dto';
import { CreatePlayerDto } from './dto/create-player.dto';

@Controller('astro-arena')
export class BattlesController {
  constructor(private readonly battlesService: BattlesService) {}
  @Post('ability')
  async createAbility(@Body() createAbilityDto: CreateAbilityDto) {
    return await this.battlesService.createAbility(createAbilityDto);
  }

  @Post('monster')
  async createMonster(@Body() createMonsterDto: CreateMonsterDto) {
    return await this.battlesService.createMonster(createMonsterDto);
  }

  @Post('player')
  async createPlayer(@Body() createPlayerDto: CreatePlayerDto) {
    return await this.battlesService.createPlayer(createPlayerDto);
  }

  @Get('battles')
  findLastBattles() {
    return this.battlesService.findLastBattles();
  }

  @Get('player/:id')
  findOne(@Param('id') id: string) {
    return this.battlesService.findOnePlayer(id);
  }
}
