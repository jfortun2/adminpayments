import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { generatePaymentCode, slugify, todayIso } from "../data/helpers";
import { CURRENT_USER_ID, people, sections, seedBatches, seedCodes, templates } from "../data/seed";
import type { PaymentBatch, PaymentCode, PaymentsState } from "../data/types";

interface PaymentsContextValue extends PaymentsState {
  currentUserId: string;
  createBatch: (input: { templateId: string; name: string; count: number }) => PaymentBatch;
  deactivateBatch: (batchId: string) => void;
  deactivateCode: (codeId: string) => void;
}

const PaymentsContext = createContext<PaymentsContextValue | null>(null);

type Action =
  | { type: "create-batch"; batch: PaymentBatch; codes: PaymentCode[] }
  | { type: "deactivate-batch"; batchId: string }
  | { type: "deactivate-code"; codeId: string };

function reducer(state: PaymentsState, action: Action): PaymentsState {
  switch (action.type) {
    case "create-batch":
      return {
        ...state,
        batches: [action.batch, ...state.batches],
        codes: [...action.codes, ...state.codes],
      };
    case "deactivate-batch":
      return {
        ...state,
        batches: state.batches.map((batch) =>
          batch.id === action.batchId ? { ...batch, status: "deactivated" } : batch,
        ),
        codes: state.codes.map((item) =>
          item.batchId === action.batchId && item.status === "unused"
            ? { ...item, status: "deactivated" }
            : item,
        ),
      };
    case "deactivate-code":
      return {
        ...state,
        codes: state.codes.map((item) =>
          item.id === action.codeId ? { ...item, status: "deactivated" } : item,
        ),
      };
    default:
      return state;
  }
}

export function PaymentsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    people,
    templates,
    sections,
    batches: seedBatches,
    codes: seedCodes,
  });

  const value = useMemo<PaymentsContextValue>(
    () => ({
      ...state,
      currentUserId: CURRENT_USER_ID,
      createBatch({ templateId, name, count }) {
        const createdAt = todayIso();
        const idBase = slugify(name) || "batch";
        const id = `${idBase}-${Date.now()}`;
        const batch: PaymentBatch = {
          id,
          templateId,
          name: name.trim(),
          createdAt,
          createdById: CURRENT_USER_ID,
          status: "active",
        };
        const existing = new Set(state.codes.map((item) => item.code));
        const codes: PaymentCode[] = Array.from({ length: count }, (_, index) => ({
          id: `${id}-code-${index + 1}`,
          batchId: id,
          code: generatePaymentCode(existing),
          status: "unused",
          createdAt,
          createdById: CURRENT_USER_ID,
        }));
        dispatch({ type: "create-batch", batch, codes });
        return batch;
      },
      deactivateBatch(batchId) {
        dispatch({ type: "deactivate-batch", batchId });
      },
      deactivateCode(codeId) {
        dispatch({ type: "deactivate-code", codeId });
      },
    }),
    [state],
  );

  return <PaymentsContext.Provider value={value}>{children}</PaymentsContext.Provider>;
}

export function usePayments() {
  const context = useContext(PaymentsContext);
  if (!context) {
    throw new Error("usePayments must be used within PaymentsProvider");
  }
  return context;
}

export function getPersonName(peopleList: { id: string; name: string }[], id?: string) {
  if (!id) return "";
  return peopleList.find((person) => person.id === id)?.name ?? "Unknown";
}
