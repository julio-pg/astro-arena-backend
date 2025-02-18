import { IsString } from 'class-validator';

export class CreatePlayerDto {
  @IsString()
  name: string;
  monsters: string[];
}
