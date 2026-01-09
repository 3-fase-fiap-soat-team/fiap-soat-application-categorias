import { randomUUID } from 'crypto';
import { IdGenerator } from 'src/interfaces/id-generator';

export class UUIDGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
