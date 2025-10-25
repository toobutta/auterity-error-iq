import { Router } from "express";
import { AuterityIntegration } from "../services/auterity-integration";
import { RelayCoreIntegration } from "../services/relaycore-integration";
import { NeuroWeaverIntegration } from "../services/neuroweaver-integration";
import { MessageBus } from "../services/message-bus";
import { CrossSystemCache } from "../services/cross-system-cache";

interface IntegrationDependencies {
  auterityIntegration: AuterityIntegration;
  relayCoreIntegration: RelayCoreIntegration;
  neuroWeaverIntegration: NeuroWeaverIntegration;
  messageBus: MessageBus;
  crossSystemCache: CrossSystemCache;
}

export const integrationRoutes = (deps: IntegrationDependencies) => {
  const router = Router();

  // System status endpoints
  router.get("/status", async (req, res) => {
    try {
      const status = {
        auterity: await deps.auterityIntegration.getStatus(),
        relaycore: await deps.relayCoreIntegration.getStatus(),
        neuroweaver: await deps.neuroWeaverIntegration.getStatus(),
        messageBus: await deps.messageBus.getStatus(),
        cache: await deps.crossSystemCache.getStatus(),
      };
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to get system status" });
    }
  });

  // Cross-system message routing
  router.post("/message", async (req, res) => {
    try {
      const { target, message, metadata } = req.body;
      const result = await deps.messageBus.sendMessage(
        target,
        message,
        metadata,
      );
      res.json({ success: true, messageId: result });
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Cache operations
  router.get("/cache/:key", async (req, res) => {
    try {
      const value = await deps.crossSystemCache.get(req.params.key);
      res.json({ key: req.params.key, value });
    } catch (error) {
      res.status(404).json({ error: "Key not found" });
    }
  });

  router.post("/cache/:key", async (req, res) => {
    try {
      await deps.crossSystemCache.set(
        req.params.key,
        req.body.value,
        req.body.options,
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to set cache value" });
    }
  });

  return router;
};

