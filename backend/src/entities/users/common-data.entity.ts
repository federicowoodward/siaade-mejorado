import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { User } from "./user.entity";
import { AddressData } from "./address-data.entity";

@Entity("common_data")
export class CommonData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @OneToOne(() => User, (u) => u.commonData)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "address_data_id", type: "int", nullable: true })
  addressDataId: number | null;

  @ManyToOne(() => AddressData, (a) => a.commonData, { nullable: true })
  @JoinColumn({ name: "address_data_id" })
  address?: AddressData | null;

  @Column({ type: "text", nullable: true })
  sex: string | null;

  @Column({ name: "birth_date", type: "date", nullable: true })
  birthDate: Date | null;

  @Column({ name: "birth_place", type: "text", nullable: true })
  birthPlace: string | null;

  @Column({ type: "text", nullable: true })
  nationality: string | null;
}
