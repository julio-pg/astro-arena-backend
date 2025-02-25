import { IsNumber, IsString } from 'class-validator';

export class CreateAbilityDto {
  @IsString()
  readonly name: string;
  @IsString()
  readonly description: string;
  @IsNumber()
  readonly power: number;
}
