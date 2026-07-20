import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBorrowRecords,
  fetchBorrowRecord,
  createBorrowRecord,
  updateBorrowRecord,
  returnBook,
  fetchReturnStats,
  fetchReturnHistory,
  renewLoan,
  deleteBorrowRecord,
  borrowForSelf,
} from "../services/api";

export function useBorrowRecords({ page = 1, limit = 7, search = "", status = "", memberType = "" } = {}) {
  return useQuery({
    queryKey: ["borrowRecords", { page, limit, search, status, memberType }],
    queryFn: () => fetchBorrowRecords({ page, limit, search, status, memberType }),
    staleTime: 10000,
    retry: 2,
  });
}

export function useBorrowRecord(id) {
  return useQuery({
    queryKey: ["borrowRecord", id],
    queryFn: () => fetchBorrowRecord(id),
    enabled: !!id,
    staleTime: 10000,
    retry: 2,
  });
}

export function useCreateBorrowRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recordData) => createBorrowRecord(recordData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrowRecords"] });
    },
  });
}

export function useUpdateBorrowRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateBorrowRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrowRecords"] });
    },
  });
}

export function useReturnBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, condition, notes }) => returnBook(id, { condition, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrowRecords"] });
      queryClient.invalidateQueries({ queryKey: ["returnStats"] });
    },
  });
}

export function useReturnStats() {
  return useQuery({
    queryKey: ["returnStats"],
    queryFn: () => fetchReturnStats(),
    staleTime: 10000,
    retry: 2,
  });
}

export function useReturnHistory({ page = 1, limit = 10, search = "", memberType = "" } = {}) {
  return useQuery({
    queryKey: ["returnHistory", { page, limit, search, memberType }],
    queryFn: () => fetchReturnHistory({ page, limit, search, memberType }),
    staleTime: 10000,
    retry: 2,
  });
}

export function useRenewLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars) => renewLoan(vars.id, vars.dueDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrowRecords"] });
    },
  });
}

export function useDeleteBorrowRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteBorrowRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrowRecords"] });
    },
  });
}

export function useBorrowForSelf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars) => borrowForSelf(vars.bookId, vars.borrowDurationDays),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["borrowRecords"] });
      queryClient.invalidateQueries({ queryKey: ["memberDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}
