import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class CreateEntryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(280)
  message: string
}
