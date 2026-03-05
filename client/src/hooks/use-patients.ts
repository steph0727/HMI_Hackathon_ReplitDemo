import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type TriageInput, type Patient } from "@shared/routes";

// Log zod parsing errors to prevent silent failures
function parseWithLogging<T>(schema: any, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function usePatients() {
  return useQuery({
    queryKey: [api.patients.list.path],
    queryFn: async () => {
      const res = await fetch(api.patients.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch patients");
      const data = await res.json();
      return parseWithLogging<Patient[]>(api.patients.list.responses[200], data, "patients.list");
    },
  });
}

export function usePatient(id: number) {
  return useQuery({
    queryKey: [api.patients.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.patients.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch patient");
      const data = await res.json();
      return parseWithLogging<Patient>(api.patients.get.responses[200], data, "patients.get");
    },
    enabled: !!id,
  });
}

export function useSubmitTriage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: TriageInput) => {
      const validated = api.patients.submitTriage.input.parse(input);
      const res = await fetch(api.patients.submitTriage.path, {
        method: api.patients.submitTriage.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to submit triage");
      }
      
      const data = await res.json();
      return parseWithLogging<Patient>(api.patients.submitTriage.responses[201], data, "patients.submit");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.patients.list.path] });
    },
  });
}

export function useUpdatePatientStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const url = buildUrl(api.patients.updateStatus.path, { id });
      const res = await fetch(url, {
        method: api.patients.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to update status");
      
      const data = await res.json();
      return parseWithLogging<Patient>(api.patients.updateStatus.responses[200], data, "patients.updateStatus");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.patients.list.path] });
    },
  });
}
