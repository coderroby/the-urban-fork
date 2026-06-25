import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";

// Let's create types for memory storage
interface UserReservation {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  occasion?: string;
  message?: string;
  createdAt: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
}

interface UserContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  createdAt: string;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  const dataFilePath = path.join(process.cwd(), "src", "restaurant-data.json");
  const reservationsFilePath = path.join(process.cwd(), "src", "reservations-history.json");
  const contactsFilePath = path.join(process.cwd(), "src", "contact-messages-history.json");

  // Helper to load file safely
  async function readJsonFile(filePath: string, fallback: any) {
    try {
      const data = await fs.readFile(filePath, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      return fallback;
    }
  }

  // Helper to write file safely
  async function writeJsonFile(filePath: string, data: any) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
      return true;
    } catch (e) {
      console.error("Failed to write file:", filePath, e);
      return false;
    }
  }

  // Initialize storage histories
  let reservations: UserReservation[] = await readJsonFile(reservationsFilePath, []);
  let contactMessages: UserContactMessage[] = await readJsonFile(contactsFilePath, []);

  // API: Get current full database/config
  app.get("/api/config", async (req, res) => {
    try {
      const config = await readJsonFile(dataFilePath, null);
      if (!config) {
        return res.status(404).json({ error: "Restaurant data file not found" });
      }
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API: Save updated configuration
  app.post("/api/config", async (req, res) => {
    try {
      const newConfig = req.body;
      if (!newConfig || typeof newConfig !== "object" || !newConfig.site) {
        return res.status(400).json({ error: "Invalid configuration format" });
      }

      const success = await writeJsonFile(dataFilePath, newConfig);
      if (success) {
        res.json({ message: "Configuration saved successfully", config: newConfig });
      } else {
        res.status(500).json({ error: "Failed to persist configuration" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API: Save reservation
  app.post("/api/reservations", async (req, res) => {
    try {
      const { name, email, phone, date, time, guests, occasion, message } = req.body;
      if (!name || !email || !phone || !date || !time || !guests) {
        return res.status(400).json({ error: "Missing required reservation fields" });
      }

      const newReservation: UserReservation = {
        id: `res-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name,
        email,
        phone,
        date,
        time,
        guests: Number(guests),
        occasion,
        message,
        createdAt: new Date().toISOString(),
        status: 'Pending'
      };

      reservations.push(newReservation);
      await writeJsonFile(reservationsFilePath, reservations);

      res.status(201).json({ 
        message: "Thank you! Your reservation request has been received.",
        reservation: newReservation 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API: Get all reservations
  app.get("/api/reservations", (req, res) => {
    res.json(reservations);
  });

  // API: Update reservation status (Approve, Cancel)
  app.patch("/api/reservations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!['Pending', 'Confirmed', 'Cancelled'].includes(status)) {
        return res.status(400).json({ error: "Invalid reservation status" });
      }

      const reservation = reservations.find(r => r.id === id);
      if (!reservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }

      reservation.status = status;
      await writeJsonFile(reservationsFilePath, reservations);
      res.json({ message: `Reservation updated to '${status}' successfully`, reservation });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API: Receive contact message
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, phone, subject, message } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ error: "Missing required contact fields" });
      }

      const newMessage: UserContactMessage = {
        id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name,
        email,
        phone,
        subject,
        message,
        createdAt: new Date().toISOString()
      };

      contactMessages.push(newMessage);
      await writeJsonFile(contactsFilePath, contactMessages);

      res.status(201).json({ 
        message: "Thanks for reaching out. We’ll get back to you soon.",
        contact: newMessage 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API: Get all contact messages
  app.get("/api/contact", (req, res) => {
    res.json(contactMessages);
  });

  // Serve Vite in development, static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
