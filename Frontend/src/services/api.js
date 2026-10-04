import api, { getErrorMessage } from './api';

/**
 * TOPE DICKSON - Audit API Integration Contract
 * Standardized interface for querying, filtering, and retrieving audit logs.
 */

// Supported query filters according to the backend API specification
export const DEFAULT_AUDIT_FILTERS = {
  search: '',
  action: '',
  entity: '',
  userId: '',
  companyId: '',
  startDate: '',
  endDate: '',
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

/**
 * Fetch paginated audit logs with search and filter support
 * Endpoint: GET /api/audit-logs
 */
export async function getAuditLogs(filters = {}) {
  try {
    const queryParams = new URLSearchParams();
    const mergedFilters = { ...DEFAULT_AUDIT_FILTERS, ...filters };

    Object.keys(mergedFilters).forEach((key) => {
      if (mergedFilters[key] !== '' && mergedFilters[key] !== null && mergedFilters[key] !== undefined) {
        queryParams.append(key, mergedFilters[key]);
      }
    });

    const response = await api.get(`/audit-logs?${queryParams.toString()}`);
    return {
      success: true,
      data: response.data.logs || response.data.data || [],
      pagination: response.data.pagination || {
        total: response.data.total || 0,
        page: mergedFilters.page,
        limit: mergedFilters.limit,
        totalPages: Math.ceil((response.data.total || 0) / mergedFilters.limit)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error)
    };
  }
}

/**
 * Fetch a single audit log by ID
 * Endpoint: GET /api/audit-logs/:id
 */
export async function getAuditLogById(id) {
  try {
    const response = await api.get(`/audit-logs/${id}`);
    return {
      success: true,
      data: response.data.log || response.data
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error)
    };
  }
}

export default {
  getAuditLogs,
  getAuditLogById,
  DEFAULT_AUDIT_FILTERS
};