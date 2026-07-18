import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBorrowRecords,
  fetchBorrowRecord,
  createBorrowRecord,
  updateBorrowRecord,
  returnBook,
  renewLoan,
  deleteBorrowRecord,
} from "../services/api";

export function useBorrowRecords({ page = 1, search = "", status = "", memberType = "" } = {}) {
  return useQuery({
    queryKey: ["borrowRecords", { page, search, status, memberType }],
    queryFn: () => fetchBorrowRecords({ page, limit: 7, search, status, memberType }),
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
    mutationFn: (id) => returnBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrowRecords"] });
    },
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
