import { PartialType } from '@nestjs/mapped-types'
import { CreateDispatchDto } from './create-dispatch.dto'

export class UpdateDispatchDto extends PartialType(CreateDispatchDto) {}
