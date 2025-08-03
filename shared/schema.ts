import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const departmentEnum = pgEnum("department", [
  "paper_creator",
  "project_office", 
  "area_office",
  "road_sale",
  "role_creator"
]);

export const doStatusEnum = pgEnum("do_status", [
  "created",
  "at_project_office",
  "at_area_office", 
  "at_road_sale",
  "completed",
  "rejected"
]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  department: departmentEnum("department").notNull(),
  isActive: varchar("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const parties = pgTable("parties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partyNumber: text("party_number").notNull().unique(),
  partyName: text("party_name").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const deliveryOrders = pgTable("delivery_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  doNumber: text("do_number").notNull().unique(),
  partyId: varchar("party_id").notNull().references(() => parties.id),
  authorizedPerson: text("authorized_person").notNull(),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  currentStatus: doStatusEnum("current_status").notNull().default("created"),
  currentLocation: departmentEnum("current_location").notNull().default("paper_creator"),
  notes: text("notes"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const workflowHistory = pgTable("workflow_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  doId: varchar("do_id").notNull().references(() => deliveryOrders.id),
  fromDepartment: departmentEnum("from_department"),
  toDepartment: departmentEnum("to_department").notNull(),
  action: text("action").notNull(),
  performedBy: varchar("performed_by").notNull().references(() => users.id),
  remarks: text("remarks"),
  performedAt: timestamp("performed_at").notNull().default(sql`now()`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  deliveryOrders: many(deliveryOrders),
  workflowHistory: many(workflowHistory),
}));

export const partiesRelations = relations(parties, ({ many }) => ({
  deliveryOrders: many(deliveryOrders),
}));

export const deliveryOrdersRelations = relations(deliveryOrders, ({ one, many }) => ({
  party: one(parties, {
    fields: [deliveryOrders.partyId],
    references: [parties.id],
  }),
  creator: one(users, {
    fields: [deliveryOrders.createdBy],
    references: [users.id],
  }),
  workflowHistory: many(workflowHistory),
}));

export const workflowHistoryRelations = relations(workflowHistory, ({ one }) => ({
  deliveryOrder: one(deliveryOrders, {
    fields: [workflowHistory.doId],
    references: [deliveryOrders.id],
  }),
  performer: one(users, {
    fields: [workflowHistory.performedBy],
    references: [users.id],
  }),
}));

// Schema types
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  department: true,
});

export const insertPartySchema = createInsertSchema(parties).pick({
  partyNumber: true,
  partyName: true,
});

export const insertDeliveryOrderSchema = createInsertSchema(deliveryOrders).pick({
  partyId: true,
  authorizedPerson: true,
  validFrom: true,
  validUntil: true,
  notes: true,
});

export const insertWorkflowHistorySchema = createInsertSchema(workflowHistory).pick({
  doId: true,
  fromDepartment: true,
  toDepartment: true,
  action: true,
  remarks: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertParty = z.infer<typeof insertPartySchema>;
export type Party = typeof parties.$inferSelect;
export type InsertDeliveryOrder = z.infer<typeof insertDeliveryOrderSchema>;
export type DeliveryOrder = typeof deliveryOrders.$inferSelect;
export type InsertWorkflowHistory = z.infer<typeof insertWorkflowHistorySchema>;
export type WorkflowHistory = typeof workflowHistory.$inferSelect;

// Extended types for queries with relations
export type DeliveryOrderWithParty = DeliveryOrder & {
  party: Party;
  creator: Pick<User, 'id' | 'username' | 'department'>;
};

export type WorkflowHistoryWithPerformer = WorkflowHistory & {
  performer: Pick<User, 'id' | 'username' | 'department'>;
};
