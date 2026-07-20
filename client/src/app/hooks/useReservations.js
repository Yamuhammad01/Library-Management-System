import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchReservationStats,
  fetchReservations,
  fetchReservation,
  createReservation,
  approveReservation,
  rejectReservation,
  cancelReservation,
  markReservationCompleted,
  notifyNextMember,
  deleteReservation,
  fetchMyReservations,
  reserveForSelf,
  cancelMyReservation,
} from "../services/api";

/* ─── Query: stat cards ─── */
export function useReservationStats() {
  return useQuery({
    queryKey: ["reservationStats"],
    queryFn:  fetchReservationStats,
    staleTime: 15000,
    retry: 2,
  });
}

/* ─── Query: list ─── */
export function useReservations({ page = 1, limit = 10, search = "", status = "", memberType = "" } = {}) {
  return useQuery({
    queryKey: ["reservations", { page, limit, search, status, memberType }],
    queryFn:  () => fetchReservations({ page, limit, search, status, memberType }),
    staleTime: 10000,
    retry: 2,
  });
}

/* ─── Query: single record ─── */
export function useReservation(id) {
  return useQuery({
    queryKey: ["reservation", id],
    queryFn:  () => fetchReservation(id),
    enabled:  !!id,
    staleTime: 10000,
  });
}

/* ─── Mutation helpers ─── */
function useReservationMutation(mutationFn, extraKeys = []) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["reservationStats"] });
      extraKeys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    },
  });
}

/* ─── Mutations ─── */
export function useCreateReservation() {
  return useReservationMutation((data) => createReservation(data));
}

export function useApproveReservation() {
  return useReservationMutation((id) => approveReservation(id));
}

export function useRejectReservation() {
  return useReservationMutation(({ id, reason }) => rejectReservation(id, reason));
}

export function useCancelReservation() {
  return useReservationMutation((id) => cancelReservation(id));
}

export function useMarkReservationCompleted() {
  // Also invalidate books so availableCopies refreshes
  return useReservationMutation((id) => markReservationCompleted(id), ["books"]);
}

export function useNotifyNextMember() {
  return useReservationMutation((bookId) => notifyNextMember(bookId));
}

export function useDeleteReservation() {
  return useReservationMutation((id) => deleteReservation(id));
}

/* ─── Member Self-Service ─── */

export function useMyReservations({ page = 1, status = "" } = {}) {
  return useQuery({
    queryKey: ["reservations", "my", { page, status }],
    queryFn:  () => fetchMyReservations({ page, limit: 50, status }),
    staleTime: 10000,
    retry: 2,
  });
}

export function useReserveForSelf() {
  return useReservationMutation(
    (bookId) => reserveForSelf(bookId),
    ["dashboard", "member", "books"]
  );
}

export function useCancelMyReservation() {
  return useReservationMutation(
    (id) => cancelMyReservation(id),
    ["dashboard", "member", "books"]
  );
}
