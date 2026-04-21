import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateDispatchDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string

  @IsString()
  @IsNotEmpty()
  body: string

  @IsString()
  @IsOptional()
  @MaxLength(200)
  slug?: string

  @IsBoolean()
  @IsOptional()
  published?: boolean
}
