# -*- coding: utf-8 -*-
"""
Module kiểm duyệt nội dung và phát hiện từ ngữ thô tục (Profanity Filter Engine).
Được thiết kế toàn diện và tối ưu hóa cho nền tảng Giáo dục Giới tính ChiChan:
1. Nhận diện và ngăn chặn chính xác các từ ngữ thô tục, chửi thề, lăng mạ, xúc phạm nhân phẩm.
2. Xử lý triệt để các thủ thuật lách luật (evasion bypass):
   - Ký tự tàng hình / zero-width space (\\u200b, \\u200c, \\ufeff...)
   - Ký tự đồng hình (Cyrillic homoglyphs a, e, o, p, c, y, x...)
   - Ký tự thay thế leetspeak (@, 0, 1, !, 3, $...)
   - Ký tự kéo dài (vclllll, đẹooooo, đmmmm)
   - Ký tự chèn dấu câu / dấu sao (đ.ụ, f*ck, c@c, l0n...)
3. TUYỆT ĐỐI BẢO VỆ các thuật ngữ khoa học, y tế, sinh học và giáo dục giới tính
   (ví dụ: thủ dâm, dương vật, âm đạo, bao cao su, màng trinh, kinh nguyệt, quan hệ tình dục, sinh đẻ, dậy thì, dụ dỗ...).
"""

import re
from typing import Tuple, Optional, Dict, Any
from fastapi import HTTPException, status

# Bảng chuyển đổi ký tự đồng hình (Homoglyphs Cyrillic -> Latinh & Leetspeak cơ bản)
HOMOGLYPHS = {
    'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x',
    'А': 'A', 'Е': 'E', 'О': 'O', 'Р': 'P', 'С': 'C', 'У': 'Y', 'Х': 'X',
    '@': 'a', '0': 'o', '1': 'i', '!': 'i', '3': 'e', '$': 's',
}

# Regex loại bỏ ký tự tàng hình / zero-width spaces / soft hyphens
INVISIBLE_CHARS = re.compile(r'[\u200b\u200c\u200d\ufeff\u00ad\u2060\u200e\u200f]')

# Danh mục các mẫu regex nhận diện từ ngữ thô tục
VULGAR_PATTERNS = [
    # 1. Từ ngữ thô tục, chửi thề trực tiếp (Đụ, Địt...)
    r"\bđụ\s*(?:má|mẹ|mame|me|bà|cha|con|mày|nhau)?\b",
    r"\bdu\s*(?:ma|me|mame|ba|cha|con|may)\b",
    r"\bđ[\s._\-\*]*ụ\b",
    # "dụ" là từ thuần Việt đúng nghĩa (dụ dỗ, bị dụ...) — chỉ chặn khi đứng kèm danh xưng
    # theo sau để tránh xoá nhầm nội dung giáo dục (vd: "phòng chống dụ dỗ trẻ em")
    r"\bdụ\s*(?:mẹ|má|cụ|mày|nhau|mợ|mame|me|ma|ba|cha|con)\b",
    r"\bd[\s._\-\*]*ụ\s*(?:mẹ|má|cụ|mày|nhau|mame|me|ma|ba|cha|con)\b",
    r"\bđịt\s*(?:mẹ|cụ|con|bà|cha|mày|nhau|mợ)?\b",
    r"\bdit\s*(?:me|cu|con|ba|cha|may|mo)\b",
    r"\bdjt\s*(?:me|cu|con|may)?\b",
    r"\bđ[\s._\-\*]*ị[\s._\-\*]*t\b",
    r"\bd[\s._\-\*]*ị[\s._\-\*]*t\b",
    
    # 2. Xúc phạm liên quan đến bộ phận sinh dục dung tục (Lồn, Cặc, Buồi...)
    r"\bcặc\b",
    r"\bcon\s*cặc\b",
    r"\bcái\s*cặc\b",
    r"\bđầu\s*cặc\b",
    r"\bcon\s*cac\b",
    r"\bc[áàảãạ]i\s*cac\b",
    r"\bd[áàảãạ]u\s*cac\b",
    r"\bc[\s._\-\*@]*ặ[\s._\-\*]*c\b",
    r"\bc[@\*]c\b",
    r"\bc[\s._\-\*@]+[aăặâ]?[c|k]\b",
    
    r"\bl[ồò]n\b",
    r"\bcái\s*l[ồò]n\b",
    r"\bcon\s*l[ồò]n\b",
    r"\bmặt\s*l[ồò]n\b",
    r"\bxàm\s*l[ồò]n\b",
    r"\bhãm\s*l[ồò]n\b",
    r"\bvãi\s*l[ồò]n\b",
    r"\bngu\s*l[ồò]n\b",
    r"\brách\s*l[ồò]n\b",
    r"\bmat\s*lon\b",
    r"\bxam\s*lon\b",
    r"\bham\s*lon\b",
    r"\bvai\s*lon\b",
    r"\bngu\s*lon\b",
    r"\bl[\s._\-\*@0]*[ồò0o][\s._\-\*]*n\b",
    r"\bl[0@]n\b",
    
    r"\bbuồi\b",
    r"\bcái\s*buồi\b",
    r"\bđầu\s*buồi\b",
    r"\bvãi\s*buồi\b",
    r"\bcai\s*buoi\b",
    r"\bdau\s*buoi\b",
    r"\bvai\s*buoi\b",
    r"\bb[\s._\-\*]*u[\s._\-\*]*ồ[\s._\-\*]*i\b",
    
    r"\bbú\s*cu\b",
    r"\bbú\s*dái\b",
    r"\bvãi\s*dái\b",
    r"\bvãi\s*đái\b",

    # 3. Phủ định tục tĩu (Đéo, Đếch...)
    r"\bđ[éẹẻẽ]+[oóòỏõ]+\b",
    r"\bđếch\b",
    r"\bđíu\b",
    r"\bđ[\s._\-\*]*[éẹẻẽ][\s._\-\*]*[oóòỏõ]+\b",
    r"\bdeo\s*(?:hieu|biet|can|do|them|me|gi)\b",
    
    # 4. Ngôn từ miệt thị, chửi bới, lăng mạ
    r"\bđĩ\s*(?:mẹ|mày|chó|thỏa|điếm|con)?\b",
    r"\bcon\s*đĩ\b",
    r"\bcon\s*di\b",
    r"\bphò\b",
    r"\bcon\s*phò\b",
    r"\bcon\s*pho\b",
    r"\bchó\s*đẻ\b",
    r"\bcho\s*de\b",
    r"\bóc\s*chó\b",
    r"\boc\s*cho\b",
    r"\bmả\s*(?:cha|mẹ)\b",
    r"\bchết\s*mẹ\b",
    r"\bchet\s*me\b",
    r"\bthằng\s*(?:chó|mặt\s*l[ồò]n|súc\s*sinh)\b",
    r"\bđồ\s*khốn\s*nạn\b",
    
    # 5. Viết tắt tục tĩu (Teencode / Acronyms) - Hỗ trợ kéo dài ký tự cuối (vclllll, vllll)
    r"\b(?:đm+|dm+|dcm+|đcm+|dkm+|đkm+|đmm+|dmm+|đcl+|vcl+|vkl+|vl+|clgt|clmm+|cđmm+)\b",
    r"\bnhư\s*cc\b",
    r"\bcái\s*cc\b",
    
    # 6. Tiếng Anh chửi thề (English Profanity)
    r"\bfuck(?:ing|er|ed)?\b",
    r"\bf[\s._\-\*]*u[\s._\-\*]*c[\s._\-\*]*k\b",
    r"\bshit(?:ty)?\b",
    r"\bbullshit\b",
    r"\bbitch(?:es)?\b",
    r"\bcunt(?:s)?\b",
    r"\basshole(?:s)?\b",
    r"\bmotherfucker\b",
    r"\bmf\b",
    r"\bbastard(?:s)?\b",
    r"\bdickhead\b",
]

COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in VULGAR_PATTERNS]

def sanitize_homoglyphs(text: str) -> str:
    """Thay thế ký tự đồng hình (Cyrillic, leetspeak) sang ký tự Latinh tương ứng"""
    res = []
    for ch in text:
        res.append(HOMOGLYPHS.get(ch, ch))
    return "".join(res)

def normalize_text(text: str) -> str:
    """Loại bỏ ký tự vô hình, thay homoglyph, chuẩn hóa ký tự lặp"""
    if not text:
        return ""
    # 1. Bỏ ký tự vô hình (zero-width spaces)
    cleaned = INVISIBLE_CHARS.sub('', text)
    # 2. Thay ký tự đồng hình
    cleaned = sanitize_homoglyphs(cleaned)
    # 3. Thu gọn 3+ ký tự trùng lặp liên tiếp thành 2 ký tự (đẹoooo -> đẹoo)
    cleaned = re.sub(r'(.)\1{2,}', r'\1\1', cleaned)
    return cleaned

def check_profanity(text: str) -> Tuple[bool, Optional[str]]:
    """
    Kiểm tra xem văn bản có chứa từ ngữ thô tục không.
    Trả về: (True, từ_vi_phạm) hoặc (False, None)
    """
    if not text or not text.strip():
        return False, None
        
    norm_text = normalize_text(text)
    
    # Kiểm tra song song trên cả chuỗi nguyên bản và chuỗi đã chuẩn hoá
    for pattern in COMPILED_PATTERNS:
        match = pattern.search(text) or pattern.search(norm_text)
        if match:
            matched_str = match.group(0).lower()
            
            # Ngoại lệ an toàn: đảm bảo các từ như "dụ dỗ" không bị bắt nhầm bởi "dụ"
            if matched_str == "dụ" and "dụ dỗ" in norm_text.lower():
                continue
                
            return True, match.group(0)
            
    return False, None

def validate_content_clean(text: str, context_label: str = "Nội dung") -> None:
    """
    Xác thực nội dung sạch. Nếu phát hiện từ ngữ thô tục, ném ngoại lệ 400 Bad Request
    với thông báo rõ ràng cho người dùng.
    """
    is_profane, term = check_profanity(text)
    if is_profane:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{context_label} chứa từ ngữ không phù hợp hoặc thô tục ('{term}'). Hệ thống đã tự động từ chối và xoá bỏ."
        )

def censor_profanity(text: str) -> str:
    """
    Thay thế các từ ngữ thô tục bằng ký tự ***
    """
    if not text:
        return ""
    censored = text
    for pattern in COMPILED_PATTERNS:
        censored = pattern.sub(lambda m: "*" * len(m.group(0)), censored)
    return censored

def get_profanity_summary(text: str) -> Dict[str, Any]:
    """
    Trả về báo cáo phân tích chi tiết để ghi nhận log hoặc kiểm toán bảo mật.
    """
    is_profane, term = check_profanity(text)
    return {
        "is_profane": is_profane,
        "matched_term": term,
        "censored_sample": censor_profanity(text) if is_profane else text
    }
