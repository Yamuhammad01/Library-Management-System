import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBooks,
  fetchBook,
  createBook,
  updateBook,
  deleteBook,
} from "../services/api";

export function useBooks({ page = 1, search = "", category = "", status = "" } = {}) {
  return useQuery({
    queryKey: ["books", { page, search, category, status }],
    queryFn: () => fetchBooks({ page, limit: 8, search, category, status }),
    staleTime: 10000,
    retry: 2,
  });
}

export function useBook(id) {
  return useQuery({
    queryKey: ["book", id],
    queryFn: () => fetchBook(id),
    enabled: !!id,
    staleTime: 10000,
    retry: 2,
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookData) => createBook(bookData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
}

export function useUpdateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateBook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
}