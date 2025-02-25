import { IsNumber, IsString } from 'class-validator';

export class CreateMonsterDto {
  @IsString()
  name: string;
  @IsString()
  image: string;
  @IsString()
  type: string;
  @IsNumber()
  healthPoints: number;

  abilities: string[];
}
