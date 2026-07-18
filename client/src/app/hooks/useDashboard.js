import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboardStats,
  fetchBorrowingActivity,
  fetchCategoryData,
} from "../services/api";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: fetchDashboardStats,
    staleTime: 30000,
    retry: 2,
  });
}

export function useBorrowingActivity() {
  return useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: fetchBorrowingActivity,
    staleTime: 30000,
    retry: 2,
  });
}

export function useCategoryData() {
  return useQuery({
    queryKey: ["dashboard", "categories"],
    queryFn: fetchCategoryData,
    staleTime: 30000,
    retry: 2,
  });
}