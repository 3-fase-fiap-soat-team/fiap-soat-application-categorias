import { Module } from '@nestjs/common';
import { IdGenerator } from 'src/interfaces/id-generator';
import { UUIDGenerator } from './uuid-generator/uuid-generator';

@Module({
  providers: [
    {
      provide: IdGenerator,
      useClass: UUIDGenerator,
    },

  ],
  exports: [IdGenerator],
})
export class ProvidersModule {}
