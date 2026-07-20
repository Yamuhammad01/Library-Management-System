import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMyBorrowingHistory } from "../services/api";

export function useMyBorrowingHistory({ page = 1, limit = 10, search = "", status = "", sortBy = "borrowDate", sortOrder = "desc" } = {}) {
  return useQuery({
    queryKey: ["myBorrowingHistory", { page, limit, search, status, sortBy, sortOrder }],
    queryFn: () => fetchMyBorrowingHistory({ page, limit, search, status, sortBy, sortOrder }),
    staleTime: 10000,
    retry: 2,
  });
}