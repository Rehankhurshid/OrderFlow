import { 
  users, 
  parties, 
  deliveryOrders, 
  workflowHistory,
  passwordResetTokens,
  type User, 
  type InsertUser,
  type Party,
  type InsertParty,
  type DeliveryOrder,
  type InsertDeliveryOrder,
  type WorkflowHistory,
  type InsertWorkflowHistory,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type DeliveryOrderWithParty,
  type WorkflowHistoryWithPerformer
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;  
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserStatus(id: string, isActive: string): Promise<void>;
  updateUserPassword(id: string, password: string): Promise<void>;
  
  getAllParties(): Promise<Party[]>;
  createParty(party: InsertParty): Promise<Party>;
  
  createDeliveryOrder(deliveryOrder: InsertDeliveryOrder & { createdBy: string }): Promise<DeliveryOrder>;
  getDeliveryOrdersByDepartment(department: string): Promise<DeliveryOrderWithParty[]>;
  getDeliveryOrderByNumber(doNumber: string): Promise<DeliveryOrderWithParty | undefined>;
  updateDeliveryOrderStatus(id: string, status: string, location: string): Promise<void>;
  getAllDeliveryOrders(): Promise<DeliveryOrderWithParty[]>;
  
  createWorkflowHistory(history: InsertWorkflowHistory & { performedBy: string }): Promise<WorkflowHistory>;
  getWorkflowHistoryByDoId(doId: string): Promise<WorkflowHistoryWithPerformer[]>;
  
  generateDoNumber(): Promise<string>;
  
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(tokenId: string): Promise<void>;
  cleanupExpiredTokens(): Promise<void>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async updateUserStatus(id: string, isActive: string): Promise<void> {
    await db.update(users).set({ isActive }).where(eq(users.id, id));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    await db.update(users).set({ password }).where(eq(users.id, id));
  }

  async getAllParties(): Promise<Party[]> {
    return await db.select().from(parties).orderBy(parties.partyName);
  }

  async createParty(insertParty: InsertParty): Promise<Party> {
    const [party] = await db
      .insert(parties)
      .values(insertParty)
      .returning();
    return party;
  }

  async createDeliveryOrder(deliveryOrderData: InsertDeliveryOrder & { createdBy: string }): Promise<DeliveryOrder> {
    const doNumber = await this.generateDoNumber();
    
    const [deliveryOrder] = await db
      .insert(deliveryOrders)
      .values({
        ...deliveryOrderData,
        doNumber,
      })
      .returning();
    
    // Create initial workflow history entry
    await this.createWorkflowHistory({
      doId: deliveryOrder.id,
      toDepartment: "paper_creator",
      action: "created",
      performedBy: deliveryOrderData.createdBy,
    });
    
    return deliveryOrder;
  }

  async getDeliveryOrdersByDepartment(department: string): Promise<DeliveryOrderWithParty[]> {
    return await db
      .select({
        id: deliveryOrders.id,
        doNumber: deliveryOrders.doNumber,
        partyId: deliveryOrders.partyId,
        authorizedPerson: deliveryOrders.authorizedPerson,
        validFrom: deliveryOrders.validFrom,
        validUntil: deliveryOrders.validUntil,
        currentStatus: deliveryOrders.currentStatus,
        currentLocation: deliveryOrders.currentLocation,
        notes: deliveryOrders.notes,
        createdBy: deliveryOrders.createdBy,
        createdAt: deliveryOrders.createdAt,
        party: {
          id: parties.id,
          partyNumber: parties.partyNumber,
          partyName: parties.partyName,
          createdAt: parties.createdAt,
        },
        creator: {
          id: users.id,
          username: users.username,
          department: users.department,
        },
      })
      .from(deliveryOrders)
      .innerJoin(parties, eq(deliveryOrders.partyId, parties.id))
      .innerJoin(users, eq(deliveryOrders.createdBy, users.id))
      .where(eq(deliveryOrders.currentLocation, department as any))
      .orderBy(desc(deliveryOrders.createdAt));
  }

  async getDeliveryOrderByNumber(doNumber: string): Promise<DeliveryOrderWithParty | undefined> {
    const result = await db
      .select({
        id: deliveryOrders.id,
        doNumber: deliveryOrders.doNumber,
        partyId: deliveryOrders.partyId,
        authorizedPerson: deliveryOrders.authorizedPerson,
        validFrom: deliveryOrders.validFrom,
        validUntil: deliveryOrders.validUntil,
        currentStatus: deliveryOrders.currentStatus,
        currentLocation: deliveryOrders.currentLocation,
        notes: deliveryOrders.notes,
        createdBy: deliveryOrders.createdBy,
        createdAt: deliveryOrders.createdAt,
        party: {
          id: parties.id,
          partyNumber: parties.partyNumber,
          partyName: parties.partyName,
          createdAt: parties.createdAt,
        },
        creator: {
          id: users.id,
          username: users.username,
          department: users.department,
        },
      })
      .from(deliveryOrders)
      .innerJoin(parties, eq(deliveryOrders.partyId, parties.id))
      .innerJoin(users, eq(deliveryOrders.createdBy, users.id))
      .where(eq(deliveryOrders.doNumber, doNumber));
    
    return result[0] || undefined;
  }

  async updateDeliveryOrderStatus(id: string, status: string, location: string): Promise<void> {
    await db
      .update(deliveryOrders)
      .set({ 
        currentStatus: status as any,
        currentLocation: location as any 
      })
      .where(eq(deliveryOrders.id, id));
  }

  async getAllDeliveryOrders(): Promise<DeliveryOrderWithParty[]> {
    return await db
      .select({
        id: deliveryOrders.id,
        doNumber: deliveryOrders.doNumber,
        partyId: deliveryOrders.partyId,
        authorizedPerson: deliveryOrders.authorizedPerson,
        validFrom: deliveryOrders.validFrom,
        validUntil: deliveryOrders.validUntil,
        currentStatus: deliveryOrders.currentStatus,
        currentLocation: deliveryOrders.currentLocation,
        notes: deliveryOrders.notes,
        createdBy: deliveryOrders.createdBy,
        createdAt: deliveryOrders.createdAt,
        party: {
          id: parties.id,
          partyNumber: parties.partyNumber,
          partyName: parties.partyName,
          createdAt: parties.createdAt,
        },
        creator: {
          id: users.id,
          username: users.username,
          department: users.department,
        },
      })
      .from(deliveryOrders)
      .innerJoin(parties, eq(deliveryOrders.partyId, parties.id))
      .innerJoin(users, eq(deliveryOrders.createdBy, users.id))
      .orderBy(desc(deliveryOrders.createdAt));
  }

  async createWorkflowHistory(historyData: InsertWorkflowHistory & { performedBy: string }): Promise<WorkflowHistory> {
    const [history] = await db
      .insert(workflowHistory)
      .values(historyData)
      .returning();
    return history;
  }

  async getWorkflowHistoryByDoId(doId: string): Promise<WorkflowHistoryWithPerformer[]> {
    return await db
      .select({
        id: workflowHistory.id,
        doId: workflowHistory.doId,
        fromDepartment: workflowHistory.fromDepartment,
        toDepartment: workflowHistory.toDepartment,
        action: workflowHistory.action,
        performedBy: workflowHistory.performedBy,
        remarks: workflowHistory.remarks,
        performedAt: workflowHistory.performedAt,
        performer: {
          id: users.id,
          username: users.username,
          department: users.department,
        },
      })
      .from(workflowHistory)
      .innerJoin(users, eq(workflowHistory.performedBy, users.id))
      .where(eq(workflowHistory.doId, doId))
      .orderBy(desc(workflowHistory.performedAt));
  }

  async generateDoNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await db
      .select()
      .from(deliveryOrders)
      .where(eq(deliveryOrders.doNumber, `DO-${year}-%`));
    
    const count = result.length + 1;
    return `DO-${year}-${count.toString().padStart(3, '0')}`;
  }

  async createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db
      .insert(passwordResetTokens)
      .values(tokenData)
      .returning();
    return token;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.isUsed, "false")
      ));
    return resetToken || undefined;
  }

  async markTokenAsUsed(tokenId: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ isUsed: "true" })
      .where(eq(passwordResetTokens.id, tokenId));
  }

  async cleanupExpiredTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(sql`expires_at < now()`);
  }
}

export const storage = new DatabaseStorage();
