import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";

@Entity("folders")
export class DriveFolder {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ name: "parent_id", type: "uuid", nullable: true })
  parentId: string | null;

  @ManyToOne(() => DriveFolder, (folder) => folder.children, { nullable: true })
  @JoinColumn({ name: "parent_id" })
  parent: DriveFolder;

  @OneToMany(() => DriveFolder, (folder) => folder.parent)
  children: DriveFolder[];

  @Column({ name: "is_starred", type: "boolean", default: false })
  isStarred: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
