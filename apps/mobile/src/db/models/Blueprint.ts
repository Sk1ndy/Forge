import { Model } from '@nozbe/watermelondb';
import { field, json, readonly, date } from '@nozbe/watermelondb/decorators';

const sanitizeState = (rawState: any) => rawState;

export class Blueprint extends Model {
  static table = 'blueprints';

  @field('nom') nom!: string;
  @field('user_id') user_id!: string;
  
  // Le parseur JSON de WatermelonDB pour stocker des objets complexes
  @json('state', sanitizeState) state!: any; 

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
