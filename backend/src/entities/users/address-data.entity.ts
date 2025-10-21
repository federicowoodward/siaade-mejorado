import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CommonData } from './common-data.entity';

@Entity('address_data')
export class AddressData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  street: string | null;

  @Column({ type: 'text', nullable: true })
  number: string | null;

  @Column({ type: 'text', nullable: true })
  floor: string | null;

  @Column({ type: 'text', nullable: true })
  apartment: string | null;

  @Column({ type: 'text', nullable: true })
  neighborhood: string | null;

  @Column({ type: 'text', nullable: true })
  locality: string | null;

  @Column({ type: 'text', nullable: true })
  province: string | null;

  @Column({ name: 'postal_code', type: 'text', nullable: true })
  postalCode: string | null;

  @Column({ type: 'text', nullable: true })
  country: string | null;

  @OneToMany(() => CommonData, (cd) => cd.address)
  commonData?: CommonData[];
}
