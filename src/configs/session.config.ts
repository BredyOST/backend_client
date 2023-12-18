import { Injectable } from '@nestjs/common'

@Injectable()
export class SessionConfig {
  secret: string
  resave: boolean
  saveUninitialized: boolean

  constructor() {
    this.secret = 'your-secret-key' // Замените на секретный ключ
    this.resave = false
    this.saveUninitialized = false
  }
}
