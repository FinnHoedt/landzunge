import { Controller, Get, Next, Req, Res } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'
import { join } from 'path'

@Controller()
export class SpaController {
  @Get('*path')
  serveAdmin(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    if (req.path.startsWith('/api/') || req.path.includes('.')) {
      return next()
    }
    res.sendFile(join(__dirname, '..', '..', 'public', 'admin', 'index.html'))
  }
}
