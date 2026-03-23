"use client";

import { useState } from "react";
import { getErrorMessage } from "@/types";

export function useApiAction<TData, TInput>(
  action: (input: TInput) => Promise<{ data?: TData }>,
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TData | null>(null);

  async function execute(input: TInput) {
    setIsLoading(true);
    setError(null);
    try {
      const result = await action(input);
      setData(result.data ?? null);
      return result;
    } catch (err) {
      const message = getErrorMessage(err, "Request failed");
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  return { execute, isLoading, error, data, setData, setError };
}

