import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import { getApiBaseUrl } from './runtime-config';

const FIELD_LABELS: Record<string, string> = {
    category_id: 'Chủ đề',
    title: 'Tiêu đề',
    content: 'Nội dung',
    email: 'Địa chỉ Email',
    password: 'Mật khẩu',
    full_name: 'Họ và tên',
    parent_comment_id: 'Bình luận',
    is_anonymous: 'Chế độ ẩn danh',
};

function formatUserFriendlyError(data: any, status: number, endpoint: string = ''): string {
    if (typeof data.detail === 'string') {
        const d = data.detail.toLowerCase();
        if (d.includes('incorrect password') || d.includes('invalid credentials') || d.includes('sai thông tin') || d.includes('không chính xác')) {
            return 'Tên đăng nhập, email hoặc mật khẩu không chính xác.';
        }
        if (d.includes('user already exists') || d.includes('email already registered')) {
            return 'Email này đã được đăng ký tài khoản.';
        }
        if (d.includes('banned') || d.includes('account is banned')) {
            return 'Tài khoản của bạn đã bị khóa hoặc vô hiệu hóa.';
        }
    }

    if (status === 401) {
        if (endpoint.includes('/auth/login')) {
            return 'Tên đăng nhập, email hoặc mật khẩu không chính xác.';
        }
        return 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.';
    }
    if (status === 403) {
        if (typeof data.detail === 'string' && data.detail) {
            return data.detail;
        }
        return 'Bạn không có quyền thực hiện hành động này.';
    }
    if (status === 404) {
        return typeof data.detail === 'string' ? data.detail : 'Không tìm thấy nội dung yêu cầu.';
    }
    if (status >= 500) {
        return 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau ít phút.';
    }

    if (typeof data.detail === 'string') {
        const d = data.detail.toLowerCase();
        if (d.includes('not authenticated') || d.includes('credentials')) {
            return 'Vui lòng đăng nhập để tiếp tục.';
        }
        return data.detail;
    }

    // Handle FastAPI / Pydantic validation error list (HTTP 422)
    if (Array.isArray(data.detail) && data.detail.length > 0) {
        const first = data.detail[0];
        if (typeof first === 'string') return first;

        if (first && typeof first.msg === 'string') {
            const fieldKey = Array.isArray(first.loc) ? String(first.loc[first.loc.length - 1]) : '';
            const fieldName = FIELD_LABELS[fieldKey] || (fieldKey && fieldKey !== 'body' ? fieldKey : 'thông tin');
            const msg = first.msg.toLowerCase();

            if (msg.includes('field required') || msg.includes('missing')) {
                if (fieldKey === 'category_id') return 'Vui lòng chọn chủ đề cho bài viết.';
                return `Vui lòng nhập ${fieldName.toLowerCase()}.`;
            }
            if (msg.includes('at least')) {
                const match = first.msg.match(/\d+/);
                return `${fieldName} phải có ít nhất ${match ? match[0] : ''} ký tự.`;
            }
            if (msg.includes('at most') || msg.includes('max_length')) {
                const match = first.msg.match(/\d+/);
                return `${fieldName} không được vượt quá ${match ? match[0] : ''} ký tự.`;
            }
            if (msg.includes('integer') || msg.includes('type')) {
                return `${fieldName} không đúng định dạng.`;
            }
            return `${fieldName}: ${first.msg}`;
        }
    }

    if (data.detail && typeof data.detail === 'object') {
        return data.detail.msg || data.detail.message || 'Dữ liệu gửi lên chưa hợp lệ.';
    }

    if (typeof data.message === 'string') {
        return data.message;
    }

    return 'Có lỗi xảy ra, vui lòng thử lại sau.';
}

export const api = {
    getToken: (options?: any) => {
        return getCookie('access_token', options);
    },
    
    saveAuth: (token: string, refresh: string | null, user: any) => {
        setCookie('access_token', token, { maxAge: 60 * 60, path: '/' });
        setCookie('user_role', user.role, { maxAge: 60 * 60, path: '/' });
        if (refresh) {
            setCookie('refresh_token', refresh, { maxAge: 30 * 24 * 60 * 60, path: '/' });
        }
        if (typeof window !== 'undefined') {
            localStorage.setItem('user_info', JSON.stringify(user));
        }
    },
    
    clearAuth: () => {
        deleteCookie('access_token', { path: '/' });
        deleteCookie('user_role', { path: '/' });
        deleteCookie('refresh_token', { path: '/' });
        if (typeof window !== 'undefined') {
            localStorage.removeItem('user_info');
        }
    },
    
    getUserInfo: () => {
        if (typeof window === 'undefined') return null;
        const info = localStorage.getItem('user_info');
        return info ? JSON.parse(info) : null;
    },
    
    request: async (endpoint: string, options: any = {}) => {
        const cookieOpts = options.cookieOpts || {};
        const token = api.getToken(cookieOpts);
        
        const headers: Record<string, string> = {
            ...options.headers,
        };
        
        const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
        if (!isFormData && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const fetchOptions: any = {
            ...options,
            headers,
        };
        
        delete fetchOptions.cookieOpts;

        let response;
        try {
            // Base URL được giải quyết lúc runtime (xem runtime-config.ts), không lúc build.
            const BASE_URL = await getApiBaseUrl();
            response = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);
        } catch (networkError: any) {
            throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.');
        }
        
        let data;
        try {
            data = await response.json();
        } catch (e) {
            data = {};
        }
        
        if (!response.ok) {
            if (response.status === 401 && typeof window !== 'undefined' && endpoint !== '/auth/login') {
                api.clearAuth();
                window.location.href = '/login';
            }

            if (response.status === 403 && typeof window !== 'undefined' && endpoint !== '/auth/login') {
                const detailStr = typeof data.detail === 'string' ? data.detail.toLowerCase() : '';
                if (detailStr.includes('vô hiệu hóa') || detailStr.includes('khóa') || detailStr.includes('banned') || detailStr.includes('inactive')) {
                    api.clearAuth();
                    window.location.href = '/login';
                }
            }

            const friendlyMessage = formatUserFriendlyError(data, response.status, endpoint);
            throw new Error(friendlyMessage);
        }
        
        return data;
    },
    
    get: (endpoint: string, options: any = {}) => api.request(endpoint, { ...options, method: 'GET' }),
    post: (endpoint: string, body: any, options: any = {}) => api.request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint: string, body: any, options: any = {}) => api.request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    upload: (endpoint: string, formData: FormData, options: any = {}) => api.request(endpoint, { ...options, method: 'POST', body: formData }),
    delete: (endpoint: string, options: any = {}) => api.request(endpoint, { ...options, method: 'DELETE' }),
};
