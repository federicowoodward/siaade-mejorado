import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './users.entity';
import { AddressData } from './address_data.entity';

@Entity('common_data')
export class CommonData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @OneToOne(() => User, (u) => u.commonData)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'address_data_id', nullable: true })
  addressDataId: number;

  @ManyToOne(() => AddressData, (a) => a.commonData, { nullable: true })
  @JoinColumn({ name: 'address_data_id' })
  address: AddressData;

  @Column({ nullable: true }) sex: string;
  @Column({ name: 'birth_date', type: 'date', nullable: true }) birthDate: Date;
  @Column({ name: 'birth_place', nullable: true }) birthPlace: string;
  @Column({ nullable: true }) nationality: string;
}
