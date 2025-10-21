import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('commission')
export class Commission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'commission_letter', type: 'text', nullable: true })
  commissionLetter: string | null;
}
