import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CommonData } from './common_data.entity';

@Entity('address_data')
export class AddressData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true }) street: string;
  @Column({ nullable: true }) number: string;
  @Column({ nullable: true }) floor: string;
  @Column({ nullable: true }) apartment: string;
  @Column({ nullable: true }) neighborhood: string;
  @Column({ nullable: true }) locality: string;
  @Column({ nullable: true }) province: string;
  @Column({ name: 'postal_code', nullable: true }) postalCode: string;
  @Column({ nullable: true }) country: string;

  @OneToMany(() => CommonData, (cd) => cd.address)
  commonData: CommonData[];
}
