const { logInfo, logError, logSystem } = require('../utils/logger');
// Colors for terminal output
const colors = {
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    reset: '\x1b[0m',
    dim: '\x1b[2m',
};
// Method colors for visual distinction
const methodColors = {
    GET: colors.green,
    POST: colors.blue,
    PUT: colors.yellow,
    PATCH: colors.magenta,
    DELETE: colors.red,
};
/**
 * Sanitizes sensitive data from cookies for logging
 */
function sanitizeCookies(cookies) {
    if (!cookies || Object.keys(cookies).length === 0) {
        return '(none)';
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(cookies)) {
        // Mask tokens but show they exist
        if (key.toLowerCase().includes('token')) {
            sanitized[key] = value ? `${value.substring(0, 10)}...` : '(empty)';
        } else {
            sanitized[key] = value;
        }
    }
    return JSON.stringify(sanitized);
}
/**
 * Formats user info for logging
 */
function formatUser(user) {
    if (!user) return '(guest)';
    return JSON.stringify({
        id: user._id || user.id,
        email: user.email,
        username: user.username
    });
}
/**
 * API Logger Middleware
 * Logs: API endpoint, method, user params, query, body, cookies, and response
 */
function apiLoggerMiddleware(req, res, next) {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 9);
    // Store original methods to intercept response
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    let responseBody = null;
    // Intercept res.json()
    res.json = function (body) {
        responseBody = body;
        return originalJson(body);
    };
    // Intercept res.send()
    res.send = function (body) {
        if (!responseBody) {
            try {
                responseBody = typeof body === 'string' ? JSON.parse(body) : body;
            } catch {
                responseBody = body;
            }
        }
        return originalSend(body);
    };
    // Log on response finish
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const methodColor = methodColors[req.method] || colors.cyan;
        const statusColor = res.statusCode >= 400 ? colors.red : colors.green;

        // Capture Set-Cookie headers
        const setCookieHeaders = res.getHeader('set-cookie');
        let setCookiesLog = '(none)';
        if (setCookieHeaders) {
            const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
            setCookiesLog = cookies.map(c => c.split(';')[0]).join(', '); // Log just key=value
        }
        const logData = {
            requestId,
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            user: req.user ? { id: req.user._id || req.user.id, email: req.user.email } : null,
            params: (req.params && Object.keys(req.params).length > 0) ? req.params : undefined,
            query: (req.query && Object.keys(req.query).length > 0) ? req.query : undefined,
            cookies: sanitizeCookies(req.cookies),
            setCookies: setCookiesLog,
            body: req.method !== 'GET' && req.body && Object.keys(req.body).length > 0
                ? sanitizeBody(req.body)
                : undefined,
            response: responseBody ? summarizeResponse(responseBody) : undefined,
        };
        // Formatted console output
        const line1 = `${colors.dim}[${requestId}]${colors.reset} ${methodColor}${req.method}${colors.reset} ${req.originalUrl} ${statusColor}${res.statusCode}${colors.reset} ${colors.dim}${duration}ms${colors.reset}`;
        const line2 = `  ${colors.cyan}User:${colors.reset} ${formatUser(req.user)} | ${colors.cyan}Cookies:${colors.reset} ${sanitizeCookies(req.cookies)}`;
        const line3 = `  ${colors.green}Set-Cookie:${colors.reset} ${setCookiesLog}`;

        let line4 = '';
        if (req.params && Object.keys(req.params).length > 0) {
            line4 += `  ${colors.magenta}Params:${colors.reset} ${JSON.stringify(req.params)}`;
        }
        if (req.query && Object.keys(req.query).length > 0) {
            line4 += ` ${colors.magenta}Query:${colors.reset} ${JSON.stringify(req.query)}`;
        }
        // Log using the existing logger
        logSystem(line1, 'API');
        logSystem(line2, 'API');
        logSystem(line3, 'API');
        if (line4) logSystem(line4, 'API');

        if (responseBody) {
            const respSummary = summarizeResponse(responseBody);
            logSystem(`  ${colors.yellow}Response:${colors.reset} ${JSON.stringify(respSummary)}`, 'API');
        }

        // Log errors with full details
        if (res.statusCode >= 400) {
            logError(`Request failed: ${JSON.stringify(logData)}`);
        }
    });
    next();
}
/**
 * Sanitizes request body to hide sensitive fields
 */
function sanitizeBody(body) {
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'accessToken', 'refreshToken'];
    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '***';
        }
    }
    return sanitized;
}
/**
 * Summarizes response body to avoid huge logs
 */
function summarizeResponse(body) {
    if (!body) return null;
    // If it's an array, show count and first item preview
    if (Array.isArray(body)) {
        return { _type: 'array', count: body.length, preview: body[0] ? '...' : null };
    }
    // If it has common response fields, extract them
    const summary = {};
    if (body.message) summary.message = body.message;
    if (body.code) summary.code = body.code;
    if (body.success !== undefined) summary.success = body.success;
    if (body.error) summary.error = body.error;
    if (body.data) {
        summary.data = Array.isArray(body.data)
            ? { _type: 'array', count: body.data.length }
            : typeof body.data === 'object'
                ? { _type: 'object', keys: Object.keys(body.data) }
                : body.data;
    }
    // If no common fields found, return keys
    if (Object.keys(summary).length === 0) {
        return { _keys: Object.keys(body).slice(0, 5) };
    }
    return summary;
}
module.exports = { apiLoggerMiddleware };