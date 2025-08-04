var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/app.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  deliveryOrders: () => deliveryOrders,
  deliveryOrdersRelations: () => deliveryOrdersRelations,
  departmentEnum: () => departmentEnum,
  doStatusEnum: () => doStatusEnum,
  insertDeliveryOrderSchema: () => insertDeliveryOrderSchema,
  insertPartySchema: () => insertPartySchema,
  insertPasswordResetTokenSchema: () => insertPasswordResetTokenSchema,
  insertUserSchema: () => insertUserSchema,
  insertWorkflowHistorySchema: () => insertWorkflowHistorySchema,
  parties: () => parties,
  partiesRelations: () => partiesRelations,
  passwordResetTokens: () => passwordResetTokens,
  passwordResetTokensRelations: () => passwordResetTokensRelations,
  users: () => users,
  usersRelations: () => usersRelations,
  workflowHistory: () => workflowHistory,
  workflowHistoryRelations: () => workflowHistoryRelations
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
var departmentEnum = pgEnum("department", [
  "paper_creator",
  "project_office",
  "area_office",
  "road_sale",
  "role_creator"
]);
var doStatusEnum = pgEnum("do_status", [
  "created",
  "at_project_office",
  "received_at_project_office",
  "dispatched_from_project_office",
  "at_area_office",
  "at_road_sale",
  "completed",
  "rejected"
]);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  department: departmentEnum("department").notNull(),
  isActive: varchar("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`)
});
var parties = pgTable("parties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partyNumber: text("party_number").notNull().unique(),
  partyName: text("party_name").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`)
});
var deliveryOrders = pgTable("delivery_orders", {
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
  createdAt: timestamp("created_at").notNull().default(sql`now()`)
});
var workflowHistory = pgTable("workflow_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  doId: varchar("do_id").notNull().references(() => deliveryOrders.id),
  fromDepartment: departmentEnum("from_department"),
  toDepartment: departmentEnum("to_department").notNull(),
  action: text("action").notNull(),
  performedBy: varchar("performed_by").notNull().references(() => users.id),
  remarks: text("remarks"),
  performedAt: timestamp("performed_at").notNull().default(sql`now()`)
});
var passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: varchar("is_used").notNull().default("false"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`)
});
var usersRelations = relations(users, ({ many }) => ({
  deliveryOrders: many(deliveryOrders),
  workflowHistory: many(workflowHistory)
}));
var partiesRelations = relations(parties, ({ many }) => ({
  deliveryOrders: many(deliveryOrders)
}));
var deliveryOrdersRelations = relations(deliveryOrders, ({ one, many }) => ({
  party: one(parties, {
    fields: [deliveryOrders.partyId],
    references: [parties.id]
  }),
  creator: one(users, {
    fields: [deliveryOrders.createdBy],
    references: [users.id]
  }),
  workflowHistory: many(workflowHistory)
}));
var workflowHistoryRelations = relations(workflowHistory, ({ one }) => ({
  deliveryOrder: one(deliveryOrders, {
    fields: [workflowHistory.doId],
    references: [deliveryOrders.id]
  }),
  performer: one(users, {
    fields: [workflowHistory.performedBy],
    references: [users.id]
  })
}));
var passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id]
  })
}));
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  department: true
});
var insertPartySchema = createInsertSchema(parties).pick({
  partyNumber: true,
  partyName: true
});
var insertDeliveryOrderSchema = createInsertSchema(deliveryOrders).pick({
  partyId: true,
  authorizedPerson: true,
  validFrom: true,
  validUntil: true,
  notes: true
});
var insertWorkflowHistorySchema = createInsertSchema(workflowHistory).pick({
  doId: true,
  fromDepartment: true,
  toDepartment: true,
  action: true,
  remarks: true
});
var insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).pick({
  userId: true,
  token: true,
  expiresAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, desc, sql as sql2, not } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
var PostgresSessionStore = connectPg(session);
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getAllUsers() {
    return await db.select().from(users).orderBy(users.createdAt);
  }
  async updateUserStatus(id, isActive) {
    await db.update(users).set({ isActive }).where(eq(users.id, id));
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async updateUserPassword(id, password) {
    await db.update(users).set({ password }).where(eq(users.id, id));
  }
  async deleteUser(id) {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }
  async getAllParties() {
    return await db.select().from(parties).orderBy(parties.partyName);
  }
  async createParty(insertParty) {
    const [party] = await db.insert(parties).values(insertParty).returning();
    return party;
  }
  async createDeliveryOrder(deliveryOrderData) {
    const existing = await this.getDeliveryOrderByNumber(deliveryOrderData.doNumber);
    if (existing) {
      throw new Error(`DO number ${deliveryOrderData.doNumber} already exists`);
    }
    const [deliveryOrder] = await db.insert(deliveryOrders).values({
      ...deliveryOrderData
    }).returning();
    await this.createWorkflowHistory({
      doId: deliveryOrder.id,
      toDepartment: "paper_creator",
      action: "created",
      performedBy: deliveryOrderData.createdBy
    });
    return deliveryOrder;
  }
  async getDeliveryOrdersByDepartment(department) {
    const whereCondition = department === "paper_creator" ? eq(users.department, department) : eq(deliveryOrders.currentLocation, department);
    return await db.select({
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
        createdAt: parties.createdAt
      },
      creator: {
        id: users.id,
        username: users.username,
        department: users.department
      }
    }).from(deliveryOrders).innerJoin(parties, eq(deliveryOrders.partyId, parties.id)).innerJoin(users, eq(deliveryOrders.createdBy, users.id)).where(whereCondition).orderBy(desc(deliveryOrders.createdAt));
  }
  async getProcessedDeliveryOrdersByDepartment(department) {
    const subquery = db.selectDistinct({ doId: workflowHistory.doId }).from(workflowHistory).where(eq(workflowHistory.fromDepartment, department)).as("processed");
    return await db.select({
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
        createdAt: parties.createdAt
      },
      creator: {
        id: users.id,
        username: users.username,
        department: users.department
      }
    }).from(deliveryOrders).innerJoin(parties, eq(deliveryOrders.partyId, parties.id)).innerJoin(users, eq(deliveryOrders.createdBy, users.id)).innerJoin(subquery, eq(deliveryOrders.id, subquery.doId)).where(sql2`${deliveryOrders.currentLocation} != ${department}`).orderBy(desc(deliveryOrders.createdAt));
  }
  async getDeliveryOrderByNumber(doNumber) {
    const result = await db.select({
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
        createdAt: parties.createdAt
      },
      creator: {
        id: users.id,
        username: users.username,
        department: users.department
      }
    }).from(deliveryOrders).innerJoin(parties, eq(deliveryOrders.partyId, parties.id)).innerJoin(users, eq(deliveryOrders.createdBy, users.id)).where(eq(deliveryOrders.doNumber, doNumber));
    return result[0] || void 0;
  }
  async updateDeliveryOrderStatus(id, status, location) {
    await db.update(deliveryOrders).set({
      currentStatus: status,
      currentLocation: location
    }).where(eq(deliveryOrders.id, id));
  }
  async getAllDeliveryOrders() {
    return await db.select({
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
        createdAt: parties.createdAt
      },
      creator: {
        id: users.id,
        username: users.username,
        department: users.department
      }
    }).from(deliveryOrders).innerJoin(parties, eq(deliveryOrders.partyId, parties.id)).innerJoin(users, eq(deliveryOrders.createdBy, users.id)).orderBy(desc(deliveryOrders.createdAt));
  }
  async createWorkflowHistory(historyData) {
    const [history] = await db.insert(workflowHistory).values(historyData).returning();
    return history;
  }
  async getWorkflowHistoryByDoId(doId) {
    return await db.select({
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
        department: users.department
      }
    }).from(workflowHistory).innerJoin(users, eq(workflowHistory.performedBy, users.id)).where(eq(workflowHistory.doId, doId)).orderBy(desc(workflowHistory.performedAt));
  }
  async generateDoNumber() {
    const year = (/* @__PURE__ */ new Date()).getFullYear();
    const result = await db.select().from(deliveryOrders).where(eq(deliveryOrders.doNumber, `DO-${year}-%`));
    const count = result.length + 1;
    return `DO-${year}-${count.toString().padStart(3, "0")}`;
  }
  async createPasswordResetToken(tokenData) {
    const [token] = await db.insert(passwordResetTokens).values(tokenData).returning();
    return token;
  }
  async getPasswordResetToken(token) {
    const [resetToken] = await db.select().from(passwordResetTokens).where(and(
      eq(passwordResetTokens.token, token),
      eq(passwordResetTokens.isUsed, "false")
    ));
    return resetToken || void 0;
  }
  async markTokenAsUsed(tokenId) {
    await db.update(passwordResetTokens).set({ isUsed: "true" }).where(eq(passwordResetTokens.id, tokenId));
  }
  async cleanupExpiredTokens() {
    await db.delete(passwordResetTokens).where(sql2`expires_at < now()`);
  }
  async getPendingDeliveryOrdersByDepartment(department) {
    return await db.select({
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
        createdAt: parties.createdAt
      },
      creator: {
        id: users.id,
        username: users.username,
        department: users.department
      }
    }).from(deliveryOrders).innerJoin(parties, eq(deliveryOrders.partyId, parties.id)).innerJoin(users, eq(deliveryOrders.createdBy, users.id)).where(and(
      eq(deliveryOrders.currentLocation, department),
      not(eq(deliveryOrders.currentStatus, "completed")),
      not(eq(deliveryOrders.currentStatus, "rejected"))
    )).orderBy(desc(deliveryOrders.createdAt));
  }
  // Project Office specific methods
  async getProjectOfficeCreatedDOs() {
    return await db.select({
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
        createdAt: parties.createdAt
      },
      creator: {
        id: users.id,
        username: users.username,
        department: users.department
      }
    }).from(deliveryOrders).innerJoin(parties, eq(deliveryOrders.partyId, parties.id)).innerJoin(users, eq(deliveryOrders.createdBy, users.id)).where(eq(deliveryOrders.currentStatus, "at_project_office")).orderBy(desc(deliveryOrders.createdAt));
  }
  async getProjectOfficeReceivedDOs() {
    return await db.select({
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
        createdAt: parties.createdAt
      },
      creator: {
        id: users.id,
        username: users.username,
        department: users.department
      }
    }).from(deliveryOrders).innerJoin(parties, eq(deliveryOrders.partyId, parties.id)).innerJoin(users, eq(deliveryOrders.createdBy, users.id)).where(eq(deliveryOrders.currentStatus, "received_at_project_office")).orderBy(desc(deliveryOrders.createdAt));
  }
  async getProjectOfficeForwardedDOs() {
    const subquery = db.selectDistinct({ doId: workflowHistory.doId }).from(workflowHistory).where(and(
      eq(workflowHistory.fromDepartment, "project_office"),
      eq(workflowHistory.action, "dispatched_to_area_office")
    )).as("forwarded");
    return await db.select({
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
        createdAt: parties.createdAt
      },
      creator: {
        id: users.id,
        username: users.username,
        department: users.department
      }
    }).from(deliveryOrders).innerJoin(parties, eq(deliveryOrders.partyId, parties.id)).innerJoin(users, eq(deliveryOrders.createdBy, users.id)).innerJoin(subquery, eq(deliveryOrders.id, subquery.doId)).orderBy(desc(deliveryOrders.createdAt));
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const parts = stored.split(".");
  if (parts.length !== 2) {
    return false;
  }
  const [hashed, salt] = parts;
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  if (!process.env.SESSION_SECRET) {
    console.warn("SESSION_SECRET not set - using default for development. SET THIS IN PRODUCTION!");
  }
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "dev-secret-change-this-in-production",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !await comparePasswords(password, user.password)) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });
  app2.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

// server/routes.ts
import { z } from "zod";
import { randomBytes as randomBytes2 } from "crypto";

// server/email.ts
import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys, SendSmtpEmail } from "@getbrevo/brevo";
var isEmailConfigured = !!process.env.BREVO_API_KEY;
var apiInstance = null;
if (isEmailConfigured) {
  apiInstance = new TransactionalEmailsApi();
  apiInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
  console.log("Email service configured with Brevo");
} else {
  console.warn("BREVO_API_KEY not set - email functionality will be disabled");
}
async function sendEmail(params) {
  if (!apiInstance) {
    console.log("Email service not configured - would have sent email to:", params.to);
    console.log("Subject:", params.subject);
    return false;
  }
  try {
    console.log(`Attempting to send email to: ${params.to}`);
    console.log(`Subject: ${params.subject}`);
    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.subject = params.subject;
    sendSmtpEmail.htmlContent = params.htmlContent;
    sendSmtpEmail.textContent = params.textContent;
    sendSmtpEmail.to = [{ email: params.to }];
    sendSmtpEmail.sender = { name: "Delivery Order System", email: "rehan@activeset.co" };
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Email sent successfully:", result);
    return true;
  } catch (error) {
    console.error("Brevo email error:", error);
    console.error("Error details:", error?.response?.body || error?.message || "Unknown error");
    return false;
  }
}
function generatePasswordResetEmailTemplate(username, resetUrl) {
  const subject = "Reset your password - Delivery Order System";
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Reset your password</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #007cba; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
            </div>
            <div class="content">
                <p>Hello ${username},</p>
                <p>You requested to reset your password for the Delivery Order Management System. Click the button below to set a new password:</p>
                <p><a href="${resetUrl}" class="button">Reset Password</a></p>
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p>${resetUrl}</p>
                <p>This link will expire in 24 hours for security reasons.</p>
                <p>If you didn't request a password reset, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>Delivery Order Management System</p>
            </div>
        </div>
    </body>
    </html>
  `;
  const textContent = `
    Password Reset Request
    
    Hello ${username},
    
    You requested to reset your password for the Delivery Order Management System. Visit this link to set a new password:
    
    ${resetUrl}
    
    This link will expire in 24 hours for security reasons.
    
    If you didn't request a password reset, please ignore this email.
    
    Delivery Order Management System
  `;
  return { subject, htmlContent, textContent };
}

// server/routes.ts
function registerRoutes(app2) {
  setupAuth(app2);
  const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };
  const requireDepartment = (departments) => {
    return (req, res, next) => {
      if (!departments.includes(req.user.department)) {
        return res.status(403).json({ message: "Access denied for your department" });
      }
      next();
    };
  };
  app2.get("/api/parties", requireAuth, async (req, res) => {
    try {
      const parties2 = await storage.getAllParties();
      res.json(parties2);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/parties", requireAuth, requireDepartment(["role_creator"]), async (req, res) => {
    try {
      const validatedData = insertPartySchema.parse(req.body);
      const party = await storage.createParty(validatedData);
      res.status(201).json(party);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.get("/api/public/delivery-orders", async (req, res) => {
    try {
      const { status, party, doNumber } = req.query;
      let deliveryOrders2 = await storage.getAllDeliveryOrders();
      if (status && status !== "all") {
        deliveryOrders2 = deliveryOrders2.filter((order) => order.currentStatus === status);
      }
      if (party && party !== "all") {
        deliveryOrders2 = deliveryOrders2.filter((order) => order.party.partyName === party);
      }
      if (doNumber) {
        deliveryOrders2 = deliveryOrders2.filter(
          (order) => order.doNumber.toLowerCase().includes(doNumber.toLowerCase())
        );
      }
      res.json(deliveryOrders2);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/public/parties", async (req, res) => {
    try {
      const parties2 = await storage.getAllParties();
      res.json(parties2);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/delivery-orders", requireAuth, requireDepartment(["paper_creator"]), async (req, res) => {
    try {
      const dataWithDates = {
        ...req.body,
        validFrom: new Date(req.body.validFrom),
        validUntil: new Date(req.body.validUntil)
      };
      const validatedData = insertDeliveryOrderSchema.parse(dataWithDates);
      const deliveryOrder = await storage.createDeliveryOrder({
        ...validatedData,
        createdBy: req.user.id,
        doNumber: req.body.doNumber
      });
      await storage.createWorkflowHistory({
        doId: deliveryOrder.id,
        fromDepartment: "paper_creator",
        toDepartment: "project_office",
        action: "submitted_to_project_office",
        performedBy: req.user.id
      });
      await storage.updateDeliveryOrderStatus(
        deliveryOrder.id,
        "at_project_office",
        "project_office"
      );
      res.status(201).json(deliveryOrder);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.get("/api/delivery-orders/my-department", requireAuth, async (req, res) => {
    try {
      const deliveryOrders2 = await storage.getDeliveryOrdersByDepartment(req.user.department);
      res.json(deliveryOrders2);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/delivery-orders/processed", requireAuth, async (req, res) => {
    try {
      const deliveryOrders2 = await storage.getProcessedDeliveryOrdersByDepartment(req.user.department);
      res.json(deliveryOrders2);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/delivery-orders/pending", requireAuth, async (req, res) => {
    try {
      const deliveryOrders2 = await storage.getPendingDeliveryOrdersByDepartment(req.user.department);
      res.json(deliveryOrders2);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/delivery-orders/project-office/created", requireAuth, requireDepartment(["project_office"]), async (req, res) => {
    try {
      const deliveryOrders2 = await storage.getProjectOfficeCreatedDOs();
      res.json(deliveryOrders2);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/delivery-orders/project-office/received", requireAuth, requireDepartment(["project_office"]), async (req, res) => {
    try {
      const deliveryOrders2 = await storage.getProjectOfficeReceivedDOs();
      res.json(deliveryOrders2);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/delivery-orders/project-office/forwarded", requireAuth, requireDepartment(["project_office"]), async (req, res) => {
    try {
      const deliveryOrders2 = await storage.getProjectOfficeForwardedDOs();
      res.json(deliveryOrders2);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/delivery-orders/all", requireAuth, requireDepartment(["role_creator"]), async (req, res) => {
    try {
      const deliveryOrders2 = await storage.getAllDeliveryOrders();
      res.json(deliveryOrders2);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/delivery-orders/search/:doNumber", async (req, res) => {
    try {
      const { doNumber } = req.params;
      const deliveryOrder = await storage.getDeliveryOrderByNumber(doNumber);
      if (!deliveryOrder) {
        return res.status(404).json({ message: "Delivery Order not found" });
      }
      const workflowHistory2 = await storage.getWorkflowHistoryByDoId(deliveryOrder.id);
      res.json({
        ...deliveryOrder,
        workflowHistory: workflowHistory2
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/delivery-orders/:id/approve", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { remarks } = req.body;
      const user = req.user;
      const nextSteps = {
        "project_office": { status: "at_area_office", location: "area_office" },
        "area_office": { status: "at_road_sale", location: "road_sale" },
        "road_sale": { status: "completed", location: "road_sale" }
      };
      const nextStep = nextSteps[user.department];
      if (!nextStep) {
        return res.status(403).json({ message: "Cannot approve from your department" });
      }
      await storage.updateDeliveryOrderStatus(id, nextStep.status, nextStep.location);
      await storage.createWorkflowHistory({
        doId: id,
        fromDepartment: user.department,
        toDepartment: nextStep.location,
        action: nextStep.status === "completed" ? "completed" : "approved_and_forwarded",
        remarks,
        performedBy: user.id
      });
      res.json({ message: "Delivery Order processed successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/delivery-orders/:id/reject", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { remarks } = req.body;
      const user = req.user;
      await storage.updateDeliveryOrderStatus(id, "rejected", user.department);
      await storage.createWorkflowHistory({
        doId: id,
        fromDepartment: user.department,
        toDepartment: user.department,
        action: "rejected",
        remarks,
        performedBy: user.id
      });
      res.json({ message: "Delivery Order rejected" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/delivery-orders/:id/receive", requireAuth, async (req, res) => {
    try {
      if (req.user.department !== "project_office") {
        return res.status(403).json({ message: "Only Project Office can mark as received" });
      }
      const { id } = req.params;
      const { remarks } = req.body;
      await storage.updateDeliveryOrderStatus(id, "received_at_project_office", "project_office");
      await storage.createWorkflowHistory({
        doId: id,
        fromDepartment: "project_office",
        toDepartment: "project_office",
        action: "received",
        remarks,
        performedBy: req.user.id
      });
      res.json({ message: "Delivery Order marked as received" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/delivery-orders/:id/dispatch", requireAuth, async (req, res) => {
    try {
      if (req.user.department !== "project_office") {
        return res.status(403).json({ message: "Only Project Office can mark as dispatched" });
      }
      const { id } = req.params;
      const { remarks } = req.body;
      await storage.updateDeliveryOrderStatus(id, "at_area_office", "area_office");
      await storage.createWorkflowHistory({
        doId: id,
        fromDepartment: "project_office",
        toDepartment: "area_office",
        action: "dispatched_to_area_office",
        remarks,
        performedBy: req.user.id
      });
      res.json({ message: "Delivery Order dispatched to Area Office" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.get("/api/users", requireAuth, requireDepartment(["role_creator"]), async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      const safeUsers = users2.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/users", requireAuth, requireDepartment(["role_creator"]), async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const hashedPassword = await hashPassword(validatedData.password);
      const userDataWithHashedPassword = {
        ...validatedData,
        password: hashedPassword
      };
      const user = await storage.createUser(userDataWithHashedPassword);
      const { password, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.patch("/api/users/:id/status", requireAuth, requireDepartment(["role_creator"]), async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const statusSchema = z.object({
        isActive: z.enum(["true", "false"])
      });
      const validatedData = statusSchema.parse({ isActive });
      await storage.updateUserStatus(id, validatedData.isActive);
      res.json({ message: "User status updated successfully" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.delete("/api/users/:id", requireAuth, requireDepartment(["role_creator"]), async (req, res) => {
    try {
      const { id } = req.params;
      if (id === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      if (error.message?.includes("foreign key") || error.code === "23503") {
        return res.status(400).json({
          message: "Cannot delete user. This user has associated records (delivery orders, workflow history, etc.). Please deactivate the user instead."
        });
      }
      res.status(400).json({ message: error.message || "Failed to delete user" });
    }
  });
  app2.post("/api/users/:id/send-reset-link", requireAuth, requireDepartment(["role_creator"]), async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const token = randomBytes2(32).toString("hex");
      const expiresAt = /* @__PURE__ */ new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt
      });
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const resetUrl = `${frontendUrl}/setup-password?token=${token}`;
      const emailTemplate = generatePasswordResetEmailTemplate(user.username, resetUrl);
      const emailSent = await sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        htmlContent: emailTemplate.htmlContent,
        textContent: emailTemplate.textContent
      });
      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send reset email" });
      }
      res.json({ message: "Password reset link sent successfully" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.get("/api/setup-password/:token", async (req, res) => {
    try {
      const { token } = req.params;
      console.log("Token validation requested for:", token);
      const resetToken = await storage.getPasswordResetToken(token);
      console.log("Reset token found:", resetToken ? "Yes" : "No");
      if (!resetToken) {
        return res.json({ valid: false });
      }
      if (/* @__PURE__ */ new Date() > resetToken.expiresAt) {
        console.log("Token expired:", resetToken.expiresAt);
        return res.json({ valid: false });
      }
      const user = await storage.getUser(resetToken.userId);
      if (!user) {
        console.log("User not found for token");
        return res.json({ valid: false });
      }
      res.json({
        valid: true,
        username: user.username,
        email: user.email
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  app2.post("/api/setup-password", async (req, res) => {
    try {
      const schema = z.object({
        token: z.string(),
        password: z.string().min(6, "Password must be at least 6 characters")
      });
      const { token, password } = schema.parse(req.body);
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      if (/* @__PURE__ */ new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "Token has expired" });
      }
      const hashedPassword = await hashPassword(password);
      await storage.updateUserPassword(resetToken.userId, hashedPassword);
      await storage.markTokenAsUsed(resetToken.id);
      res.json({ message: "Password set successfully" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.post("/api/request-password-reset", async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email()
      });
      const { email } = schema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.json({ message: "If the email exists, a reset link has been sent" });
      }
      const token = randomBytes2(32).toString("hex");
      const expiresAt = /* @__PURE__ */ new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt
      });
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const resetUrl = `${frontendUrl}/setup-password?token=${token}`;
      const emailTemplate = generatePasswordResetEmailTemplate(user.username, resetUrl);
      await sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        htmlContent: emailTemplate.htmlContent,
        textContent: emailTemplate.textContent
      });
      res.json({ message: "If the email exists, a reset link has been sent" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.post("/api/change-password", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6, "Password must be at least 6 characters")
      });
      const { currentPassword, newPassword } = schema.parse(req.body);
      const user = req.user;
      const dbUser = await storage.getUser(user.id);
      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const isCurrentPasswordValid = await comparePasswords(currentPassword, dbUser.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  app2.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      let deliveryOrders2;
      if (user.department === "role_creator") {
        deliveryOrders2 = await storage.getAllDeliveryOrders();
      } else {
        deliveryOrders2 = await storage.getDeliveryOrdersByDepartment(user.department);
      }
      const stats = {
        total: deliveryOrders2.length,
        inProgress: deliveryOrders2.filter(
          (delivery) => ["at_project_office", "received_at_project_office", "dispatched_from_project_office", "at_area_office", "at_road_sale"].includes(delivery.currentStatus)
        ).length,
        completed: deliveryOrders2.filter((delivery) => delivery.currentStatus === "completed").length,
        pending: deliveryOrders2.filter(
          (delivery) => delivery.currentLocation === user.department && delivery.currentStatus !== "completed" && delivery.currentStatus !== "rejected"
        ).length
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/static.ts
import express from "express";
import fs from "fs";
import path from "path";
function serveStatic(app2) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
  if (!fs.existsSync(distPath)) {
    console.warn(`Build directory not found: ${distPath}`);
    return;
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// server/app.ts
async function createApp() {
  const app2 = express2();
  app2.use(express2.json());
  app2.use(express2.urlencoded({ extended: false }));
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path2.startsWith("/api")) {
        let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "\u2026";
        }
        console.log(logLine);
      }
    });
    next();
  });
  await registerRoutes(app2);
  app2.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app2.get("env") !== "development") {
    serveStatic(app2);
  }
  return app2;
}

// server/vercel.ts
var app;
async function handler(req, res) {
  if (!app) {
    app = await createApp();
  }
  return app(req, res);
}
export {
  handler as default
};
