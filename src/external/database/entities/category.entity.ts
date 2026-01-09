import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('categories')
export class CategoryEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;
}
