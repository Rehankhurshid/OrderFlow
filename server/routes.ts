import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
import { storage } from "./storage";
import { insertDeliveryOrderSchema, insertPartySchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { randomBytes } from "crypto";
import { sendEmail, generatePasswordSetupEmailTemplate, generatePasswordResetEmailTemplate } from "./email";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Middleware to check user authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Middleware to check department access
  const requireDepartment = (departments: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!departments.includes(req.user.department)) {
        return res.status(403).json({ message: "Access denied for your department" });
      }
      next();
    };
  };

  // Party management routes
  app.get("/api/parties", requireAuth, async (req, res) => {
    try {
      const parties = await storage.getAllParties();
      res.json(parties);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/parties", requireAuth, requireDepartment(["role_creator"]), async (req, res) => {
    try {
      const validatedData = insertPartySchema.parse(req.body);
      const party = await storage.createParty(validatedData);
      res.status(201).json(party);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Delivery Order routes
  app.post("/api/delivery-orders", requireAuth, requireDepartment(["paper_creator"]), async (req, res) => {
    try {
      const validatedData = insertDeliveryOrderSchema.parse(req.body);
      const deliveryOrder = await storage.createDeliveryOrder({
        ...validatedData,
        createdBy: req.user!.id,
      });
      
      // Create workflow history for submission to project office
      await storage.createWorkflowHistory({
        doId: deliveryOrder.id,
        fromDepartment: "paper_creator",
        toDepartment: "project_office",
        action: "submitted_to_project_office",
        performedBy: req.user!.id,
      });

      // Update DO status and location
      await storage.updateDeliveryOrderStatus(
        deliveryOrder.id, 
        "at_project_office", 
        "project_office"
      );
      
      res.status(201).json(deliveryOrder);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/delivery-orders/my-department", requireAuth, async (req, res) => {
    try {
      const deliveryOrders = await storage.getDeliveryOrdersByDepartment(req.user!.department);
      res.json(deliveryOrders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/delivery-orders/all", requireAuth, requireDepartment(["role_creator"]), async (req, res) => {
    try {
      const deliveryOrders = await storage.getAllDeliveryOrders();
      res.json(deliveryOrders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/delivery-orders/search/:doNumber", async (req, res) => {
    try {
      const { doNumber } = req.params;
      const deliveryOrder = await storage.getDeliveryOrderByNumber(doNumber);
      
      if (!deliveryOrder) {
        return res.status(404).json({ message: "Delivery Order not found" });
      }

      const workflowHistory = await storage.getWorkflowHistoryByDoId(deliveryOrder.id);
      
      res.json({
        ...deliveryOrder,
        workflowHistory
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Workflow actions
  app.post("/api/delivery-orders/:id/approve", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { remarks } = req.body;
      const user = req.user;

      // Define next department and status based on current department
      const nextSteps: any = {
        "project_office": { status: "at_area_office", location: "area_office" },
        "area_office": { status: "at_road_sale", location: "road_sale" },
        "road_sale": { status: "completed", location: "road_sale" }
      };

      const nextStep = nextSteps[user!.department];
      if (!nextStep) {
        return res.status(403).json({ message: "Cannot approve from your department" });
      }

      // Update DO status
      await storage.updateDeliveryOrderStatus(id, nextStep.status, nextStep.location);

      // Create workflow history
      await storage.createWorkflowHistory({
        doId: id,
        fromDepartment: user!.department,
        toDepartment: nextStep.location,
        action: nextStep.status === "completed" ? "completed" : "approved_and_forwarded",
        remarks,
        performedBy: user!.id,
      });

      res.json({ message: "Delivery Order processed successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/delivery-orders/:id/reject", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { remarks } = req.body;
      const user = req.user;

      await storage.updateDeliveryOrderStatus(id, "rejected", user!.department);

      await storage.createWorkflowHistory({
        doId: id,
        fromDepartment: user!.department,
        toDepartment: user!.department,
        action: "rejected",
        remarks,
        performedBy: user!.id,
      });

      res.json({ message: "Delivery Order rejected" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User management routes (Role Creator only)
  app.get("/api/users", requireAuth, requireDepartment(["role_creator"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove password from response
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/users", requireAuth, requireDepartment(["role_creator"]), async (req, res) => {
    try {
      // Modified schema to not require password - it will be set via email
      const userSchema = insertUserSchema.omit({ password: true });
      const validatedData = userSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create user with temporary password that will be changed
      const tempPassword = await hashPassword(randomBytes(32).toString("hex"));
      const userDataWithTempPassword = {
        ...validatedData,
        password: tempPassword
      };

      const user = await storage.createUser(userDataWithTempPassword);
      
      // Generate password setup token
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now
      
      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt
      });
      
      // Send invitation email
      const setupUrl = `${req.protocol}://${req.get('host')}/setup-password?token=${token}`;
      const emailTemplate = generatePasswordSetupEmailTemplate(user.username, setupUrl);
      
      const emailSent = await sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        htmlContent: emailTemplate.htmlContent,
        textContent: emailTemplate.textContent
      });
      
      if (!emailSent) {
        return res.status(500).json({ message: "User created but failed to send invitation email" });
      }
      
      const { password, ...safeUser } = user;
      res.status(201).json({ ...safeUser, invitationSent: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/users/:id/status", requireAuth, requireDepartment(["role_creator"]), async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      const statusSchema = z.object({
        isActive: z.enum(["true", "false"])
      });
      
      const validatedData = statusSchema.parse({ isActive });
      await storage.updateUserStatus(id, validatedData.isActive);
      
      res.json({ message: "User status updated successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Password setup and reset routes
  app.get("/api/setup-password/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "Token has expired" });
      }
      
      const user = await storage.getUser(resetToken.userId);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
      
      res.json({ 
        valid: true, 
        username: user.username,
        email: user.email 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/setup-password", async (req, res) => {
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
      
      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "Token has expired" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(password);
      
      // Update user password directly in database
      await storage.updateUserPassword(resetToken.userId, hashedPassword);
      
      // Mark token as used
      await storage.markTokenAsUsed(resetToken.id);
      
      res.json({ message: "Password set successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/request-password-reset", async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email()
      });
      
      const { email } = schema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ message: "If the email exists, a reset link has been sent" });
      }
      
      // Generate password reset token
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now
      
      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt
      });
      
      // Send reset email
      const resetUrl = `${req.protocol}://${req.get('host')}/setup-password?token=${token}`;
      const emailTemplate = generatePasswordResetEmailTemplate(user.username, resetUrl);
      
      await sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        htmlContent: emailTemplate.htmlContent,
        textContent: emailTemplate.textContent
      });
      
      res.json({ message: "If the email exists, a reset link has been sent" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/change-password", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6, "Password must be at least 6 characters")
      });
      
      const { currentPassword, newPassword } = schema.parse(req.body);
      const user = req.user!;
      
      // Verify current password
      const dbUser = await storage.getUser(user.id);
      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const isCurrentPasswordValid = await comparePasswords(currentPassword, dbUser.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash and update new password
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);
      
      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      let deliveryOrders;
      
      if (user!.department === "role_creator") {
        deliveryOrders = await storage.getAllDeliveryOrders();
      } else {
        deliveryOrders = await storage.getDeliveryOrdersByDepartment(user!.department);
      }

      const stats = {
        total: deliveryOrders.length,
        inProgress: deliveryOrders.filter(delivery => 
          ["at_project_office", "at_area_office", "at_road_sale"].includes(delivery.currentStatus)
        ).length,
        completed: deliveryOrders.filter(delivery => delivery.currentStatus === "completed").length,
        pending: deliveryOrders.filter(delivery => 
          delivery.currentLocation === user!.department && delivery.currentStatus !== "completed"
        ).length,
      };

      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
