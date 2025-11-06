import { GraphQLError } from 'graphql'

/**
 * Maximum allowed query size in bytes (100KB)
 */
const MAX_QUERY_SIZE = 102400

/**
 * Validates request body structure and content
 * @param {unknown} body - Request body to validate
 * @returns {void}
 * @throws {GraphQLError} If validation fails
 */
export function validate_request_body(body) {
  // Check if body is an object (not array, null, or primitive)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new GraphQLError('Request body must be an object')
  }

  // Check if query is provided and is a string
  if (body.query !== undefined && typeof body.query !== 'string') {
    throw new GraphQLError('Query must be a string')
  }

  // Check query size limit
  if (body.query && body.query.length > MAX_QUERY_SIZE) {
    throw new GraphQLError(
      `Query too large (${body.query.length} bytes, max ${MAX_QUERY_SIZE} bytes)`,
    )
  }

  // Check variables is object if provided
  if (
    body.variables !== undefined &&
    body.variables !== null &&
    typeof body.variables !== 'object'
  ) {
    throw new GraphQLError('Variables must be an object')
  }

  // Check operationName is string if provided
  if (
    body.operationName !== undefined &&
    body.operationName !== null &&
    typeof body.operationName !== 'string'
  ) {
    throw new GraphQLError('Operation name must be a string')
  }

  // Check operation_name is string if provided (snake_case variant)
  if (
    body.operation_name !== undefined &&
    body.operation_name !== null &&
    typeof body.operation_name !== 'string'
  ) {
    throw new GraphQLError('Operation name must be a string')
  }
}

/**
 * Wraps build_context with timeout protection
 * @param {Function} build_context - Context builder function
 * @param {number} timeout_ms - Timeout in milliseconds (default 5000)
 * @returns {Function} Wrapped context builder
 */
export function with_timeout(build_context, timeout_ms = 5000) {
  return async (...args) => {
    const timeout_promise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Context building timed out')),
        timeout_ms,
      ),
    )

    return Promise.race([build_context(...args), timeout_promise])
  }
}
