import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import { ensureCompatibleFormat, speechToText } from "./replit_integrations/audio/client";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

async function seedDatabase() {
  const patientsList = await storage.getPatients();
  if (patientsList.length === 0) {
    await storage.createPatient({
      name: "John Doe",
      age: 45,
      medicalHistory: "Hypertension",
      familyHistory: "Heart Disease",
      rawInput: "I feel dizzy and my chest hurts when I breathe.",
      extractedSymptoms: ["chest pain", "dizziness"],
      urgencyScore: 9,
      status: "waiting",
      explanation: "Chest pain combined with a history of hypertension and family history of heart disease suggests a potential cardiac event."
    });
    
    await storage.createPatient({
      name: "Jane Smith",
      age: 28,
      medicalHistory: "Asthma",
      familyHistory: "None",
      rawInput: "I've had a cough and mild wheezing for a few days, but no fever.",
      extractedSymptoms: ["cough", "wheezing"],
      urgencyScore: 4,
      status: "waiting",
      explanation: "Mild respiratory symptoms in an asthmatic patient, but absence of fever or severe distress lowers urgency."
    });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  await seedDatabase();

  app.post("/api/transcribe", async (req, res) => {
    try {
      const { audio } = req.body;
      if (!audio) return res.status(400).json({ message: "No audio provided" });
      const rawBuffer = Buffer.from(audio, "base64");
      const { buffer: audioBuffer, format: inputFormat } = await ensureCompatibleFormat(rawBuffer);
      const text = await speechToText(audioBuffer, inputFormat);
      res.json({ text });
    } catch (error) {
      console.error("Transcription error:", error);
      res.status(500).json({ message: "Failed to transcribe" });
    }
  });

  app.get(api.patients.list.path, async (req, res) => {
    try {
      const patientsList = await storage.getPatients();
      res.json(patientsList);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.patients.get.path, async (req, res) => {
    try {
      const patient = await storage.getPatient(Number(req.params.id));
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.patients.updateStatus.path, async (req, res) => {
    try {
      const { status } = req.body;
      const patient = await storage.updatePatientStatus(Number(req.params.id), status);
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.patients.submitTriage.path, async (req, res) => {
    try {
      const input = api.patients.submitTriage.input.parse(req.body);
      
      let rawSymptomsText = input.symptomsInput;
      
      if (input.isAudio) {
        const rawBuffer = Buffer.from(input.symptomsInput, "base64");
        const { buffer: audioBuffer, format: inputFormat } = await ensureCompatibleFormat(rawBuffer);
        rawSymptomsText = await speechToText(audioBuffer, inputFormat);
      }

      const systemPrompt = `You are a medical triage AI designed for clinics in developing countries. Analyze the patient data and calculate an urgency score from 1-10 (10 being highest urgency).
Extract symptoms into an array of strings. 
Identify the language used in the symptoms input.
Provide a brief explanation for the score based on symptoms and risk factors (age, medical history, family history).
Respond ONLY in JSON format matching this structure:
{
  "extractedSymptoms": ["symptom1", "symptom2"],
  "urgencyScore": 8,
  "explanation": "Brief explanation...",
  "detectedLanguage": "English"
}`;

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Patient Name: ${input.name}, Age: ${input.age}, Medical History: ${input.medicalHistory}, Family History: ${input.familyHistory}, Symptoms: ${rawSymptomsText}` }
        ],
        response_format: { type: "json_object" }
      });
      
      const aiResult = JSON.parse(aiResponse.choices[0].message?.content || "{}");
      
      const patient = await storage.createPatient({
        name: input.name,
        age: input.age,
        medicalHistory: input.medicalHistory || "None",
        familyHistory: input.familyHistory || "None",
        rawInput: rawSymptomsText,
        extractedSymptoms: aiResult.extractedSymptoms || [],
        urgencyScore: aiResult.urgencyScore || 1,
        status: "waiting",
        explanation: aiResult.explanation || "No explanation provided.",
        detectedLanguage: aiResult.detectedLanguage || "Unknown"
      });
      
      res.status(201).json(patient);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Triage Error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
