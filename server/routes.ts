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

  // Public API endpoints for portal
  app.get("/api/public/delivery-orders", async (req, res) => {
    try {
      const { status, party, doNumber } = req.query;
      
      let deliveryOrders = await storage.getAllDeliveryOrders();
      
      // Filter by status if provided
      if (status && status !== "all") {
        deliveryOrders = deliveryOrders.filter(order => order.currentStatus === status);
      }
      
      // Filter by party if provided
      if (party && party !== "all") {
        deliveryOrders = deliveryOrders.filter(order => order.party.partyName === party);
      }
      
      // Filter by DO number if provided
      if (doNumber) {
        deliveryOrders = deliveryOrders.filter(order => 
          order.doNumber.toLowerCase().includes((doNumber as string).toLowerCase())
        );
      }
      
      res.json(deliveryOrders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/public/parties", async (req, res) => {
    try {
      const parties = await storage.getAllParties();
      res.json(parties);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delivery Order routes
  app.post("/api/delivery-orders", requireAuth, requireDepartment(["paper_creator"]), async (req, res) => {
    try {
      // Convert date strings to Date objects before validation
      const dataWithDates = {
        ...req.body,
        validFrom: new Date(req.body.validFrom),
        validUntil: new Date(req.body.validUntil),
      };
      
      const validatedData = insertDeliveryOrderSchema.parse(dataWithDates);
      const deliveryOrder = await storage.createDeliveryOrder({
        ...validatedData,
        createdBy: req.user!.id,
        doNumber: req.body.doNumber,
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

  app.get("/api/delivery-orders/processed", requireAuth, async (req, res) => {
    try {
      const deliveryOrders = await storage.getProcessedDeliveryOrdersByDepartment(req.user!.department);
      res.json(deliveryOrders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/delivery-orders/pending", requireAuth, async (req, res) => {
    try {
      const deliveryOrders = await storage.getPendingDeliveryOrdersByDepartment(req.user!.department);
      res.json(deliveryOrders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Project Office specific routes
  app.get("/api/delivery-orders/project-office/created", requireAuth, requireDepartment(["project_office"]), async (req, res) => {
    try {
      const deliveryOrders = await storage.getProjectOfficeCreatedDOs();
      res.json(deliveryOrders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/delivery-orders/project-office/received", requireAuth, requireDepartment(["project_office"]), async (req, res) => {
    try {
      const deliveryOrders = await storage.getProjectOfficeReceivedDOs();
      res.json(deliveryOrders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/delivery-orders/project-office/forwarded", requireAuth, requireDepartment(["project_office"]), async (req, res) => {
    try {
      const deliveryOrders = await storage.getProjectOfficeForwardedDOs();
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

  // Mark as received (Project Office only)
  app.post("/api/delivery-orders/:id/receive", requireAuth, async (req, res) => {
    try {
      if (req.user!.department !== "project_office") {
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
        performedBy: req.user!.id,
      });

      res.json({ message: "Delivery Order marked as received" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Mark as dispatched (Project Office only) - forwards to Area Office
  app.post("/api/delivery-orders/:id/dispatch", requireAuth, async (req, res) => {
    try {
      if (req.user!.department !== "project_office") {
        return res.status(403).json({ message: "Only Project Office can mark as dispatched" });
      }

      const { id } = req.params;
      const { remarks } = req.body;

      // Forward to Area Office
      await storage.updateDeliveryOrderStatus(id, "at_area_office", "area_office");

      await storage.createWorkflowHistory({
        doId: id,
        fromDepartment: "project_office",
        toDepartment: "area_office",
        action: "dispatched_to_area_office",
        remarks,
        performedBy: req.user!.id,
      });

      res.json({ message: "Delivery Order dispatched to Area Office" });
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
      // Now accepting password directly from the admin
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash the provided password
      const hashedPassword = await hashPassword(validatedData.password);
      const userDataWithHashedPassword = {
        ...validatedData,
        password: hashedPassword
      };

      const user = await storage.createUser(userDataWithHashedPassword);
      
      const { password, ...safeUser } = user;
      res.status(201).json(safeUser);
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

  // Delete user route (admin only)
  app.delete("/api/users/:id", requireAuth, requireDepartment(["role_creator"]), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Prevent deleting yourself
      if (id === req.user!.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Delete user error:", error);
      
      // Check if it's a foreign key constraint error
      if (error.message?.includes("foreign key") || error.code === "23503") {
        return res.status(400).json({ 
          message: "Cannot delete user. This user has associated records (delivery orders, workflow history, etc.). Please deactivate the user instead." 
        });
      }
      
      res.status(400).json({ message: error.message || "Failed to delete user" });
    }
  });

  // Send password reset link (admin only)
  app.post("/api/users/:id/send-reset-link", requireAuth, requireDepartment(["role_creator"]), async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
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
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Password setup and reset routes
  app.get("/api/setup-password/:token", async (req, res) => {
    try {
      const { token } = req.params;
      console.log("Token validation requested for:", token);
      
      const resetToken = await storage.getPasswordResetToken(token);
      console.log("Reset token found:", resetToken ? "Yes" : "No");
      
      if (!resetToken) {
        return res.json({ valid: false });
      }
      
      if (new Date() > resetToken.expiresAt) {
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
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const resetUrl = `${frontendUrl}/setup-password?token=${token}`;
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
          ["at_project_office", "received_at_project_office", "dispatched_from_project_office", "at_area_office", "at_road_sale"].includes(delivery.currentStatus)
        ).length,
        completed: deliveryOrders.filter(delivery => delivery.currentStatus === "completed").length,
        pending: deliveryOrders.filter(delivery => 
          delivery.currentLocation === user!.department && delivery.currentStatus !== "completed" && delivery.currentStatus !== "rejected"
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
